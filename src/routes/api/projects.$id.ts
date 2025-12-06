import { createFileRoute } from "@tanstack/react-router";

import { prisma } from "@/db";
import { auth } from "@/lib/auth";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const isImageFile = (file: File | undefined | null) => {
	if (!file) return false;
	const mime = file.type.toLowerCase();
	const name = file.name.toLowerCase();
	return (
		mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)
	);
};

const isPdfOrImageFile = (file: File | undefined | null) => {
	if (!file) return false;
	const mime = file.type.toLowerCase();
	const name = file.name.toLowerCase();
	return (
		mime.startsWith("image/") ||
		mime === "application/pdf" ||
		name.endsWith(".pdf")
	);
};

const json = (status: number, data: unknown) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});

const bufferToDataUrl = (buffer: Buffer, mimeType: string) => {
	const base64 = Buffer.from(buffer).toString("base64");
	return `data:${mimeType};base64,${base64}`;
};

type RoomMeta = {
	id: string;
	name: string;
	type: string;
	description?: string | null;
	useProjectPlan?: boolean;
};

const toFilePayload = async (file: File) => {
	const buffer = await file.arrayBuffer().then((ab) => Buffer.from(ab));
	const mimeType = file.type || "application/octet-stream";
	return {
		name: file.name || "upload",
		mimeType,
		bytes: buffer,
	};
};

export const Route = createFileRoute("/api/projects/$id")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return json(401, { error: "Unauthorized" });
				}

				const project = (await prisma.project.findFirst({
					where: { id: params.id, ownerId: session.user.id },
					select: {
						id: true,
						name: true,
						description: true,
						createdAt: true,
						updatedAt: true,
						rooms: {
							orderBy: { createdAt: "asc" },
							select: {
								id: true,
								name: true,
								type: true,
								description: true,
								createdAt: true,
								floorPlanFile: {
									select: { id: true, name: true, mimeType: true, bytes: true },
								},
								imageFile: {
									select: { id: true, name: true, mimeType: true, bytes: true },
								},
							},
						},
					},
					// biome-ignore lint/suspicious/noExplicitAny: Prisma generated types miss optional fields like description in this project build
				} as any)) as {
					id: string;
					name: string;
					description: string | null;
					createdAt: Date;
					updatedAt: Date;
					rooms: Array<{
						id: string;
						name: string;
						type: string;
						description: string | null;
						createdAt: Date;
						floorPlanFile: {
							id: string;
							name: string;
							mimeType: string;
							bytes: Buffer;
						};
						imageFile: {
							id: string;
							name: string;
							mimeType: string;
							bytes: Buffer;
						} | null;
					}>;
				} | null;

				if (!project) {
					return json(404, { error: "Project not found" });
				}

				return json(200, {
					project: {
						id: project.id,
						name: project.name,
						description: project.description ?? null,
						createdAt: project.createdAt,
						updatedAt: project.updatedAt,
						rooms: project.rooms.map((room) => {
							const floorPlanBuffer = Buffer.from(room.floorPlanFile.bytes);
							const floorPlanMime = room.floorPlanFile.mimeType;
							const imageBuffer = room.imageFile
								? Buffer.from(room.imageFile.bytes)
								: null;
							const imageMime = room.imageFile?.mimeType ?? null;

							return {
								id: room.id,
								name: room.name,
								type: room.type,
								description: room.description ?? null,
								createdAt: room.createdAt,
								imageDataUrl: imageBuffer
									? bufferToDataUrl(imageBuffer, imageMime ?? "image/png")
									: null,
								imageFileName: room.imageFile?.name ?? null,
								floorPlanDataUrl: floorPlanBuffer
									? bufferToDataUrl(floorPlanBuffer, floorPlanMime)
									: null,
								floorPlanMimeType: floorPlanMime,
								floorPlanFileName: room.floorPlanFile.name,
							};
						}),
					},
				});
			},
			PUT: async ({ request, params }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return json(401, { error: "Unauthorized" });
				}

				let formData: FormData;
				try {
					formData = await request.formData();
				} catch {
					return json(400, { error: "Invalid form data" });
				}

				const name = (formData.get("name") ?? "").toString().trim();
				if (!name) {
					return json(400, { error: "Project name is required" });
				}
				const description = (formData.get("description") ?? "")
					.toString()
					.trim();

				const roomsRaw = formData.get("rooms");
				if (!roomsRaw) {
					return json(400, { error: "Rooms payload missing" });
				}

				let roomsMeta: RoomMeta[] = [];
				try {
					const parsed =
						typeof roomsRaw === "string" ? roomsRaw : roomsRaw.toString();
					roomsMeta = JSON.parse(parsed) as RoomMeta[];
				} catch {
					return json(400, { error: "Invalid rooms payload" });
				}

				const deletedRoomIdsRaw = formData.get("deletedRoomIds");
				let deletedRoomIds: string[] = [];
				if (deletedRoomIdsRaw) {
					try {
						const parsed =
							typeof deletedRoomIdsRaw === "string"
								? deletedRoomIdsRaw
								: deletedRoomIdsRaw.toString();
						deletedRoomIds = JSON.parse(parsed) as string[];
					} catch {
						return json(400, { error: "Invalid deletedRoomIds payload" });
					}
				}

				const project = (await prisma.project.findFirst({
					where: { id: params.id, ownerId: session.user.id },
					select: {
						id: true,
						defaultFloorPlanFileId: true,
						rooms: {
							select: {
								id: true,
								floorPlanFileId: true,
								imageFileId: true,
							},
						},
					},
					// biome-ignore lint/suspicious/noExplicitAny: Prisma generated types not refreshed yet
				} as any)) as {
					id: string;
					defaultFloorPlanFileId: string | null;
					rooms: Array<{
						id: string;
						floorPlanFileId: string;
						imageFileId: string | null;
					}>;
				} | null;

				if (!project) {
					return json(404, { error: "Project not found" });
				}

				const existingRoomIds = new Set(project.rooms.map((room) => room.id));
				const projectFloorPlanFile = formData.get("projectFloorPlan");
				let projectFloorPlanRecord: { id: string } | null = null;
				const projectFloorPlanRemoved =
					formData.get("projectFloorPlanRemoved") === "true";

				if (projectFloorPlanFile instanceof File) {
					if (!isPdfOrImageFile(projectFloorPlanFile)) {
						return json(400, {
							error: "Project floor plan must be a PDF or image file.",
						});
					}
					if (projectFloorPlanFile.size > MAX_FILE_BYTES) {
						return json(400, {
							error: "Project floor plan must be at most 10MB.",
						});
					}
					const payload = await toFilePayload(projectFloorPlanFile);
					projectFloorPlanRecord = await prisma.file.create({
						// biome-ignore lint/suspicious/noExplicitAny: Buffer friction with generated types
						data: payload as any,
						select: { id: true },
					});
				}

				const createInputs: Array<{
					id: string;
					name: string;
					type: string;
					description?: string;
					floorPlanFileId: string;
					imageFileId?: string;
				}> = [];
				const updateInputs: Array<{
					id: string;
					data: {
						name: string;
						type: string;
						description?: string | null;
						floorPlanFileId?: string;
						imageFileId?: string | null;
					};
				}> = [];

				for (let idx = 0; idx < roomsMeta.length; idx++) {
					const room = roomsMeta[idx];
					if (!room?.id) {
						return json(400, { error: `Room ${idx + 1}: id is required` });
					}
					if (!room?.name?.trim()) {
						return json(400, { error: `Room ${idx + 1}: name is required` });
					}
					if (!room?.type) {
						return json(400, { error: `Room ${idx + 1}: type is required` });
					}

					const imageFile = formData.get(`roomImage-${room.id}`);
					let imageFileId: string | undefined;
					if (imageFile instanceof File) {
						if (!isImageFile(imageFile)) {
							return json(400, {
								error: `Room ${idx + 1}: image must be an image file.`,
							});
						}
						if (imageFile.size > MAX_FILE_BYTES) {
							return json(400, {
								error: `Room ${idx + 1}: image must be at most 10MB.`,
							});
						}
						const payload = await toFilePayload(imageFile);
						const record = await prisma.file.create({
							// biome-ignore lint/suspicious/noExplicitAny: Buffer friction with generated types
							data: payload as any,
							select: { id: true },
						});
						imageFileId = record.id;
					}

					const roomPlan = formData.get(`roomFloorPlan-${room.id}`);
					const isExistingRoom = existingRoomIds.has(room.id);
					const existingRoom = project.rooms.find((r) => r.id === room.id);
					let floorPlanFileId: string | undefined;

					if (roomPlan instanceof File) {
						if (!isPdfOrImageFile(roomPlan)) {
							return json(400, {
								error: `Room ${idx + 1}: floor plan must be a PDF or image file.`,
							});
						}
						if (roomPlan.size > MAX_FILE_BYTES) {
							return json(400, {
								error: `Room ${idx + 1}: floor plan must be at most 10MB.`,
							});
						}
						const payload = await toFilePayload(roomPlan);
						const record = await prisma.file.create({
							// biome-ignore lint/suspicious/noExplicitAny: Buffer friction with generated types
							data: payload as any,
							select: { id: true },
						});
						floorPlanFileId = record.id;
					} else if (isExistingRoom) {
						floorPlanFileId = existingRoom?.floorPlanFileId;
					} else if (room.useProjectPlan) {
						if (projectFloorPlanRecord) {
							floorPlanFileId = projectFloorPlanRecord.id;
						} else if (
							!projectFloorPlanRemoved &&
							project.defaultFloorPlanFileId
						) {
							floorPlanFileId = project.defaultFloorPlanFileId;
						}
					}

					if (!floorPlanFileId) {
						return json(400, {
							error: `Room ${idx + 1}: floor plan is required (project or per-room).`,
						});
					}

					if (isExistingRoom) {
						updateInputs.push({
							id: room.id,
							data: {
								name: room.name.trim(),
								type: room.type,
								description: room.description?.trim() || null,
								...(floorPlanFileId
									? { floorPlanFileId }
									: existingRoom?.floorPlanFileId
										? {}
										: {}),
								...(imageFileId !== undefined ? { imageFileId } : {}),
							},
						});
					} else {
						createInputs.push({
							id: room.id,
							name: room.name.trim(),
							type: room.type,
							description: room.description?.trim() || undefined,
							floorPlanFileId,
							imageFileId,
						});
					}
				}

				const deleteIds = deletedRoomIds.filter((id) =>
					existingRoomIds.has(id),
				);
				const finalRoomCount =
					project.rooms.length - deleteIds.length + createInputs.length;

				if (finalRoomCount <= 0) {
					return json(400, { error: "At least one room is required" });
				}

				await prisma.$transaction(async (tx) => {
					await tx.project.update({
						where: { id: params.id },
						// biome-ignore lint/suspicious/noExplicitAny: Prisma types currently omit description
						data: {
							name,
							description: description || null,
							defaultFloorPlanFileId: projectFloorPlanRemoved
								? null
								: (projectFloorPlanRecord?.id ??
									project.defaultFloorPlanFileId),
						} as any,
					});

					if (deleteIds.length) {
						await tx.room.deleteMany({
							where: { id: { in: deleteIds }, projectId: params.id },
						});
					}

					for (const update of updateInputs) {
						await tx.room.update({
							where: { id: update.id, projectId: params.id },
							// biome-ignore lint/suspicious/noExplicitAny: Buffer friction in generated types
							data: update.data as any,
						});
					}

					for (const create of createInputs) {
						await tx.room.create({
							// biome-ignore lint/suspicious/noExplicitAny: Buffer friction in generated types
							data: { projectId: params.id, ...create } as any,
						});
					}
				});

				return json(200, { projectId: params.id });
			},
			DELETE: async ({ request, params }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return json(401, { error: "Unauthorized" });
				}

				try {
					await prisma.project.delete({
						where: { id: params.id, ownerId: session.user.id },
					});
				} catch {
					return json(404, { error: "Project not found" });
				}

				return json(200, { success: true });
			},
		},
	},
});

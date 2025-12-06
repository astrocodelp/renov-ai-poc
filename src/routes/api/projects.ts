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

export const Route = createFileRoute("/api/projects")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session) {
					return json(401, { error: "Unauthorized" });
				}

				const projects = await prisma.project.findMany({
					where: { ownerId: session.user.id },
					select: {
						id: true,
						name: true,
						createdAt: true,
						updatedAt: true,
						_count: { select: { rooms: true } },
					},
					orderBy: { updatedAt: "desc" },
				});

				return json(200, {
					projects: projects.map((project) => ({
						id: project.id,
						name: project.name,
						createdAt: project.createdAt,
						updatedAt: project.updatedAt,
						roomCount: project._count.rooms,
					})),
				});
			},
			POST: async ({ request }) => {
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

				if (!Array.isArray(roomsMeta) || roomsMeta.length === 0) {
					return json(400, { error: "At least one room is required" });
				}

				const projectFloorPlanFile = formData.get("projectFloorPlan");

				if (
					projectFloorPlanFile &&
					projectFloorPlanFile instanceof File &&
					!isPdfOrImageFile(projectFloorPlanFile)
				) {
					return json(400, {
						error: "Project floor plan must be a PDF or image file.",
					});
				}
				if (
					projectFloorPlanFile &&
					projectFloorPlanFile instanceof File &&
					projectFloorPlanFile.size > MAX_FILE_BYTES
				) {
					return json(400, {
						error: "Project floor plan must be at most 10MB.",
					});
				}

				let projectId: string;

				try {
					projectId = await prisma.$transaction(async (tx) => {
						let projectFloorPlanRecord: { id: string } | null = null;

						if (projectFloorPlanFile instanceof File) {
							const payload = await toFilePayload(projectFloorPlanFile);
							projectFloorPlanRecord = await tx.file.create({
								// biome-ignore lint/suspicious/noExplicitAny: Buffer friction with generated types
								data: payload as any,
								select: { id: true },
							});
						}

						const roomCreatesPromise = roomsMeta.map(async (room, idx) => {
							if (!room?.name?.trim()) {
								throw new Error(`Room ${idx + 1}: name is required`);
							}
							if (!room?.type) {
								throw new Error(`Room ${idx + 1}: type is required`);
							}

							const imageFile = formData.get(`roomImage-${room.id}`);
							let imageFileRecord: { id: string } | undefined;
							if (imageFile instanceof File) {
								if (!isImageFile(imageFile)) {
									throw new Error(
										`Room ${idx + 1}: image must be an image file.`,
									);
								}
								if (imageFile.size > MAX_FILE_BYTES) {
									throw new Error(
										`Room ${idx + 1}: image must be at most 10MB.`,
									);
								}
								const payload = await toFilePayload(imageFile);
								imageFileRecord = await tx.file.create({
									// biome-ignore lint/suspicious/noExplicitAny: Buffer friction with generated types
									data: payload as any,
									select: { id: true },
								});
							}

							const roomPlan = formData.get(`roomFloorPlan-${room.id}`);
							const wantsProjectPlan =
								room.useProjectPlan ?? Boolean(projectFloorPlanRecord);
							let floorPlanFile: File | null = null;
							let floorPlanFileId: string | undefined;
							if (roomPlan instanceof File) {
								floorPlanFile = roomPlan;
							} else if (
								wantsProjectPlan &&
								projectFloorPlanFile instanceof File
							) {
								floorPlanFile = projectFloorPlanFile;
							} else if (wantsProjectPlan && projectFloorPlanRecord) {
								floorPlanFileId = projectFloorPlanRecord.id;
							}

							if (!floorPlanFile && !floorPlanFileId) {
								throw new Error(
									`Room ${idx + 1}: floor plan is required (project or per-room).`,
								);
							}

							if (!floorPlanFile && floorPlanFileId) {
								return {
									name: room.name.trim(),
									type: room.type,
									description: room.description?.trim() || undefined,
									floorPlanFileId,
									imageFileId: imageFileRecord?.id,
								};
							}

							if (!floorPlanFile) {
								throw new Error(
									`Room ${idx + 1}: floor plan is required (project or per-room).`,
								);
							}

							if (!isPdfOrImageFile(floorPlanFile)) {
								throw new Error(
									`Room ${idx + 1}: floor plan must be a PDF or image file.`,
								);
							}
							if (floorPlanFile.size > MAX_FILE_BYTES) {
								throw new Error(
									`Room ${idx + 1}: floor plan must be at most 10MB.`,
								);
							}

							const payload = await toFilePayload(floorPlanFile);
							const floorPlanRecord = await tx.file.create({
								// biome-ignore lint/suspicious/noExplicitAny: Buffer friction with generated types
								data: payload as any,
								select: { id: true },
							});

							return {
								name: room.name.trim(),
								type: room.type,
								description: room.description?.trim() || undefined,
								imageFileId: imageFileRecord?.id,
								floorPlanFileId: floorPlanRecord.id,
							};
						});

						let roomCreates: Array<{
							name: string;
							type: string;
							description?: string;
							floorPlanFileId: string;
							imageFileId?: string;
						}>;

						try {
							roomCreates = await Promise.all(roomCreatesPromise);
						} catch (error) {
							const message =
								error instanceof Error ? error.message : "Invalid room data";
							throw new Error(message);
						}

						const project = await tx.project.create({
							data: {
								name,
								description: description || undefined,
								ownerId: session.user.id,
								defaultFloorPlanFileId: projectFloorPlanRecord?.id,
								rooms: {
									// biome-ignore lint/suspicious/noExplicitAny: Buffer vs ArrayBuffer type friction in generated types
									create: roomCreates as any,
								},
							},
							select: { id: true },
						});

						return project.id;
					});
				} catch (error) {
					const message = error instanceof Error ? error.message : null;
					if (message?.startsWith("Room ") || message === "Invalid room data") {
						return json(400, { error: message });
					}

					return json(500, { error: "Failed to create project" });
				}

				return json(201, { projectId });
			},
		},
	},
});

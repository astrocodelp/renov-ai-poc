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
};

export const Route = createFileRoute("/api/projects")({
	server: {
		handlers: {
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

				const roomCreatesPromise = roomsMeta.map(async (room, idx) => {
					if (!room?.name?.trim()) {
						throw new Error(`Room ${idx + 1}: name is required`);
					}
					if (!room?.type) {
						throw new Error(`Room ${idx + 1}: type is required`);
					}

					const imageFile = formData.get(`roomImage-${room.id}`);
					if (!(imageFile instanceof File)) {
						throw new Error(`Room ${idx + 1}: image is required`);
					}
					if (!isImageFile(imageFile)) {
						throw new Error(`Room ${idx + 1}: image must be an image file.`);
					}
					if (imageFile.size > MAX_FILE_BYTES) {
						throw new Error(`Room ${idx + 1}: image must be at most 10MB.`);
					}

					const roomPlan = formData.get(`roomFloorPlan-${room.id}`);
					const floorPlanFile =
						roomPlan instanceof File
							? roomPlan
							: projectFloorPlanFile instanceof File
								? projectFloorPlanFile
								: null;
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

					const [image, floorPlan] = await Promise.all([
						imageFile.arrayBuffer().then((ab) => Buffer.from(ab)),
						floorPlanFile.arrayBuffer().then((ab) => Buffer.from(ab)),
					]);

					return {
						name: room.name.trim(),
						type: room.type,
						image,
						floorPlan,
					};
				});

				let roomCreates: Array<{
					name: string;
					type: string;
					image: Buffer;
					floorPlan: Buffer;
				}>;

				try {
					roomCreates = await Promise.all(roomCreatesPromise);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Invalid room data";
					return json(400, { error: message });
				}

				const project = await prisma.project.create({
					data: {
						name,
						ownerId: session.user.id,
						rooms: {
							// biome-ignore lint/suspicious/noExplicitAny: Buffer vs ArrayBuffer type friction in generated types
							create: roomCreates as any,
						},
					},
					select: { id: true },
				});

				return json(201, { projectId: project.id });
			},
		},
	},
});

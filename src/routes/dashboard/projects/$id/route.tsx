/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { auth } from "@/lib/auth";

export type RoomType =
	| "LIVING_ROOM"
	| "KITCHEN"
	| "BATHROOM"
	| "BEDROOM"
	| "DINING_ROOM"
	| "OFFICE"
	| "OTHER";

export type ProjectRoom = {
	id: string;
	name: string;
	type: RoomType;
	description: string | null;
	createdAt: string;
	imageDataUrl: string | null;
	imageFileName?: string | null;
	floorPlanDataUrl: string | null;
	floorPlanMimeType: string | null;
	floorPlanFileName?: string | null;
};

export type ProjectDetail = {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	defaultFloorPlanDataUrl: string | null;
	defaultFloorPlanFileName?: string | null;
	rooms: ProjectRoom[];
};

const bufferToDataUrl = (buffer: Buffer, mimeType: string) => {
	const base64 = Buffer.from(buffer).toString("base64");
	return `data:${mimeType};base64,${base64}`;
};

// Layout route for /dashboard/projects/$id and its children (/edit)
export const Route = createFileRoute("/dashboard/projects/$id")({
	component: ProjectLayout,
	server: {
		middleware: [authMiddleware],
	},
	loader: async ({ params }): Promise<ProjectDetail> =>
		// @ts-expect-error server fn typing friction
		getProject({ data: { id: params.id } }),
});

const getProject = createServerFn({ method: "GET" }).handler(
	// @ts-expect-error server fn ctx typing friction
	async ({
		request,
		data,
	}: {
		request: Request;
		data: { id: string };
	}): Promise<ProjectDetail> => {
		const { id } = data;
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session) {
			throw redirect({ to: "/login", replace: true });
		}

		const { prisma } = await import("@/db");

		const project = (await prisma.project.findFirst({
			where: { id, ownerId: session.user.id },
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
				defaultFloorPlanFile: {
					select: { id: true, name: true, mimeType: true, bytes: true },
				},
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
			// biome-ignore lint/suspicious/noExplicitAny: Prisma generated types miss optional fields
		} as any)) as {
			id: string;
			name: string;
			description: string | null;
			createdAt: Date;
			updatedAt: Date;
			defaultFloorPlanFile: {
				id: string;
				name: string;
				mimeType: string;
				bytes: Buffer;
			} | null;
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
			throw new Error("Project not found");
		}

		return {
			id: project.id,
			name: project.name,
			description: project.description,
			createdAt: project.createdAt.toISOString(),
			updatedAt: project.updatedAt.toISOString(),
			defaultFloorPlanDataUrl: project.defaultFloorPlanFile
				? bufferToDataUrl(
						Buffer.from(project.defaultFloorPlanFile.bytes),
						project.defaultFloorPlanFile.mimeType,
					)
				: null,
			defaultFloorPlanFileName: project.defaultFloorPlanFile?.name ?? null,
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
					type: room.type as RoomType,
					description: room.description,
					createdAt: room.createdAt.toISOString(),
					imageDataUrl: imageBuffer
						? bufferToDataUrl(imageBuffer, imageMime ?? "image/png")
						: null,
					imageFileName: room.imageFile?.name ?? null,
					floorPlanDataUrl: bufferToDataUrl(floorPlanBuffer, floorPlanMime),
					floorPlanMimeType: floorPlanMime,
					floorPlanFileName: room.floorPlanFile.name,
				};
			}),
		};
	},
);

function ProjectLayout() {
	return <Outlet />;
}

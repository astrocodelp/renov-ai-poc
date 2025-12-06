import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/projects/new")({
	component: NewProject,
});

type RoomType =
	| "LIVING_ROOM"
	| "KITCHEN"
	| "BATHROOM"
	| "BEDROOM"
	| "DINING_ROOM"
	| "OFFICE"
	| "OTHER";

type RoomForm = {
	id: string;
	name: string;
	type: RoomType;
	image?: File;
	floorPlan?: File;
	useProjectPlan: boolean;
};

const ROOM_TYPES: RoomType[] = [
	"LIVING_ROOM",
	"KITCHEN",
	"BATHROOM",
	"BEDROOM",
	"DINING_ROOM",
	"OFFICE",
	"OTHER",
];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const isImageFile = (file: File | undefined) => {
	if (!file) return false;
	const mime = file.type.toLowerCase();
	const name = file.name.toLowerCase();
	return (
		mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)
	);
};

const isPdfOrImageFile = (file: File | undefined) => {
	if (!file) return false;
	const mime = file.type.toLowerCase();
	const name = file.name.toLowerCase();
	return (
		mime.startsWith("image/") ||
		mime === "application/pdf" ||
		name.endsWith(".pdf")
	);
};

function newRoom(): RoomForm {
	return {
		id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
		name: "",
		type: "LIVING_ROOM",
		floorPlan: undefined,
		useProjectPlan: true,
	};
}

function NewProject() {
	const [projectName, setProjectName] = useState("");
	const [projectFloorPlan, setProjectFloorPlan] = useState<File | undefined>();
	const [rooms, setRooms] = useState<RoomForm[]>([newRoom()]);
	const [errors, setErrors] = useState<string[]>([]);
	const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(
		null,
	);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleRoomUpdate = (roomId: string, update: Partial<RoomForm>) => {
		setRooms((prev) =>
			prev.map((room) => (room.id === roomId ? { ...room, ...update } : room)),
		);
	};

	const handleAddRoom = () => {
		setRooms((prev) => [
			...prev,
			{
				...newRoom(),
				floorPlan: projectFloorPlan,
				useProjectPlan: Boolean(projectFloorPlan),
			},
		]);
	};

	const handleRemoveRoom = (roomId: string) => {
		setRooms((prev) => prev.filter((room) => room.id !== roomId));
	};

	const validate = () => {
		const nextErrors: string[] = [];
		if (!projectName.trim()) {
			nextErrors.push("Project name is required.");
		}
		if (!rooms.length) {
			nextErrors.push("At least one room is required.");
		}
		if (projectFloorPlan && !isPdfOrImageFile(projectFloorPlan)) {
			nextErrors.push("Project floor plan must be a PDF or image.");
		} else if (projectFloorPlan && projectFloorPlan.size > MAX_FILE_BYTES) {
			nextErrors.push("Project floor plan must be at most 10MB.");
		}
		rooms.forEach((room, idx) => {
			if (!room.name.trim()) {
				nextErrors.push(`Room ${idx + 1}: name is required.`);
			}
			if (!room.image) {
				nextErrors.push(`Room ${idx + 1}: image is required.`);
			} else if (!isImageFile(room.image)) {
				nextErrors.push(`Room ${idx + 1}: image must be an image file.`);
			} else if (room.image.size > MAX_FILE_BYTES) {
				nextErrors.push(`Room ${idx + 1}: image must be at most 10MB.`);
			}
			if (!room.type) {
				nextErrors.push(`Room ${idx + 1}: type is required.`);
			}
			const selectedFloorPlan =
				room.floorPlan ?? (room.useProjectPlan ? projectFloorPlan : undefined);
			if (!selectedFloorPlan) {
				nextErrors.push(
					`Room ${idx + 1}: floor plan is required (project or per-room).`,
				);
			}
			if (selectedFloorPlan && !isPdfOrImageFile(selectedFloorPlan)) {
				nextErrors.push(
					`Room ${idx + 1}: floor plan must be a PDF or image file.`,
				);
			} else if (selectedFloorPlan && selectedFloorPlan.size > MAX_FILE_BYTES) {
				nextErrors.push(`Room ${idx + 1}: floor plan must be at most 10MB.`);
			}
		});
		return nextErrors;
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const errs = validate();
		setErrors(errs);
		setSubmitError(null);
		setSubmittedProjectId(null);
		if (errs.length) {
			return;
		}

		const formData = new FormData();
		formData.set("name", projectName.trim());
		if (projectFloorPlan) {
			formData.set("projectFloorPlan", projectFloorPlan);
		}

		formData.set(
			"rooms",
			JSON.stringify(
				rooms.map((room) => ({
					id: room.id,
					name: room.name.trim(),
					type: room.type,
				})),
			),
		);

		for (const room of rooms) {
			if (room.image) {
				formData.set(`roomImage-${room.id}`, room.image);
			}
			const floorPlanFile =
				room.floorPlan ?? (room.useProjectPlan ? projectFloorPlan : undefined);
			if (floorPlanFile) {
				formData.set(`roomFloorPlan-${room.id}`, floorPlanFile);
			}
		}

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/projects", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const data = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error || "Failed to create project");
			}

			const data = (await response.json()) as { projectId: string };
			setSubmittedProjectId(data.projectId);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-black dark:text-white">
					Create Project
				</h1>
				<p className="text-sm text-neutral-500 dark:text-neutral-400">
					Provide the project details, add rooms, upload floor plans
					(PDF/image), and include a photo for each room. At least one room with
					an image is required.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">
				<section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
					<h2 className="text-lg font-medium text-black dark:text-white">
						Project details
					</h2>
					<div className="space-y-2">
						<Label htmlFor="project-name">Project name *</Label>
						<Input
							id="project-name"
							placeholder="e.g. Rivera Family Remodel"
							value={projectName}
							onChange={(e) => setProjectName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div>
								<Label>Project floor plan (PDF/image)</Label>
								<p className="text-xs text-neutral-500 dark:text-neutral-400">
									Uploading here will copy the file to all rooms automatically.
								</p>
								<a
									className="text-xs text-blue-600 underline dark:text-blue-400"
									href="/sample-floor-plan.pdf"
									download
								>
									Download sample floor plan (PDF)
								</a>
							</div>
						</div>
						<div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
							<FileUpload
								id="project-floorplan-input"
								key={`project-floorplan`}
								containerClassName="min-h-[340px]"
								files={projectFloorPlan ? [projectFloorPlan] : []}
								accept={{
									"application/pdf": [],
									"image/png": [],
									"image/jpeg": [],
									"image/webp": [],
								}}
								onChange={(files) => {
									const file = files[0];
									if (file) {
										setProjectFloorPlan(file);
										setRooms((prev) =>
											prev.map((room) =>
												room.useProjectPlan
													? { ...room, floorPlan: file }
													: room,
											),
										);
										return;
									}

									// Removal: clear project floor plan and any copied room floor plans
									setProjectFloorPlan(undefined);
									setRooms((prev) =>
										prev.map((room) =>
											room.useProjectPlan
												? { ...room, floorPlan: undefined }
												: room,
										),
									);
								}}
							/>
							{projectFloorPlan && (
								<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
									Selected: {projectFloorPlan.name} (
									{(projectFloorPlan.size / (1024 * 1024)).toFixed(2)} MB)
								</p>
							)}
						</div>
					</div>
				</section>

				<section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-medium text-black dark:text-white">
							Rooms
						</h2>
						<Button type="button" variant="outline" onClick={handleAddRoom}>
							Add room
						</Button>
					</div>
					<div className="space-y-6">
						{rooms.map((room, index) => (
							<div
								key={room.id}
								className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
							>
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
										Room {index + 1}
									</p>
									<Button
										type="button"
										variant="ghost"
										className="text-xs text-destructive"
										disabled={rooms.length === 1}
										onClick={() => handleRemoveRoom(room.id)}
									>
										Remove
									</Button>
								</div>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor={`room-name-${room.id}`}>Room name *</Label>
										<Input
											id={`room-name-${room.id}`}
											placeholder="e.g. Kitchen"
											value={room.name}
											onChange={(e) =>
												handleRoomUpdate(room.id, { name: e.target.value })
											}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`room-type-${room.id}`}>Room type *</Label>
										<select
											id={`room-type-${room.id}`}
											className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-800 shadow-input focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
											value={room.type}
											onChange={(e) =>
												handleRoomUpdate(room.id, {
													type: e.target.value as RoomType,
												})
											}
										>
											{ROOM_TYPES.map((type) => (
												<option key={type} value={type}>
													{type.replace("_", " ")}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label>Room image *</Label>
										<div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
											<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
												Sample living room image:{" "}
												<a
													href="/room.jpg"
													download
													className="text-blue-600 underline dark:text-blue-400"
												>
													room.jpg
												</a>
											</p>
											<FileUpload
												key={`room-image-${room.id}`}
												id={`room-image-input-${room.id}`}
												containerClassName="min-h-[300px]"
												accept={{
													"image/png": [],
													"image/jpeg": [],
													"image/webp": [],
												}}
												onChange={(files) => {
													const file = files[0];
													if (!file) return;
													handleRoomUpdate(room.id, { image: file });
												}}
											/>
											{room.image && (
												<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
													Selected: {room.image.name} (
													{(room.image.size / (1024 * 1024)).toFixed(2)} MB)
												</p>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label>Room floor plan</Label>
											{room.useProjectPlan &&
												projectFloorPlan &&
												!room.floorPlan && (
													<span className="text-[11px] text-blue-600 dark:text-blue-400">
														Using project floor plan
													</span>
												)}
										</div>
										<div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
											<p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
												Use a floor plan for this room or add a project floor
												plan above to copy to all rooms.
											</p>
											<FileUpload
												key={`room-floorplan-${room.id}`}
												id={`room-floorplan-input-${room.id}`}
												containerClassName="min-h-[300px]"
												files={
													room.floorPlan
														? [room.floorPlan]
														: room.useProjectPlan && projectFloorPlan
															? [projectFloorPlan]
															: []
												}
												accept={{
													"application/pdf": [],
													"image/png": [],
													"image/jpeg": [],
													"image/webp": [],
												}}
												onChange={(files) => {
													const file = files[0];
													handleRoomUpdate(room.id, {
														floorPlan: file ?? undefined,
														useProjectPlan: file
															? false
															: Boolean(projectFloorPlan),
													});
												}}
											/>
											{room.floorPlan ? (
												<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
													Selected: {room.floorPlan.name} (
													{(room.floorPlan.size / (1024 * 1024)).toFixed(2)} MB)
												</p>
											) : room.useProjectPlan && projectFloorPlan ? (
												<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
													Using project floor plan: {projectFloorPlan.name} (
													{(projectFloorPlan.size / (1024 * 1024)).toFixed(2)}{" "}
													MB)
												</p>
											) : null}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>

				{errors.length > 0 && (
					<div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950">
						<p className="font-medium">Please fix the following:</p>
						<ul className="list-disc space-y-1 pl-5">
							{errors.map((err) => (
								<li key={err}>{err}</li>
							))}
						</ul>
					</div>
				)}

				<div className="flex items-center justify-end gap-3">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save project"}
					</Button>
				</div>
			</form>

			{submittedProjectId && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950">
					Project created successfully (id: {submittedProjectId}).
				</div>
			)}
			{submitError && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950">
					{submitError}
				</div>
			)}
		</div>
	);
}

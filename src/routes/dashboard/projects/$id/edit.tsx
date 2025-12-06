import {
	createFileRoute,
	getRouteApi,
	Link,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ProjectDetail, ProjectRoom, RoomType } from "./route";

type RoomForm = {
	id: string;
	name: string;
	type: RoomType;
	description?: string;
	image?: File;
	floorPlan?: File;
	useProjectPlan: boolean;
	isExisting: boolean;
	hasExistingImage: boolean;
	hasExistingFloorPlan: boolean;
	imageDataUrl?: string | null;
	floorPlanDataUrl?: string | null;
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

const isLikelyImageUrl = (url?: string | null) => {
	if (!url) return false;
	const lower = url.toLowerCase();
	return (
		lower.startsWith("data:image") ||
		/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(lower)
	);
};

function newRoom(): RoomForm {
	return {
		id: Math.random().toString(36),
		name: "",
		type: "LIVING_ROOM",
		description: "",
		floorPlan: undefined,
		useProjectPlan: true,
		isExisting: false,
		hasExistingImage: false,
		hasExistingFloorPlan: false,
		imageDataUrl: null,
		floorPlanDataUrl: null,
	};
}

// Get access to the parent route's loader data
const parentRoute = getRouteApi("/dashboard/projects/$id");

export const Route = createFileRoute("/dashboard/projects/$id/edit")({
	component: EditProjectPage,
});

function EditProjectPage() {
	// Use the parent route's loader data
	const project = parentRoute.useLoaderData() as ProjectDetail;
	const navigate = useNavigate();

	const [projectDefaultFloorPlanUrl] = useState<string | null>(
		project.defaultFloorPlanDataUrl,
	);
	const [projectDefaultFloorPlanName] = useState<string | null>(
		project.defaultFloorPlanFileName ?? null,
	);
	const [initialHasProjectDefaultFloorPlan] = useState(
		Boolean(project.defaultFloorPlanDataUrl),
	);

	const initialRooms = project.rooms.map((room: ProjectRoom) => ({
		id: room.id,
		name: room.name,
		type: room.type as RoomType,
		description: room.description ?? "",
		image: undefined,
		floorPlan: undefined,
		useProjectPlan:
			!room.floorPlanDataUrl && Boolean(project.defaultFloorPlanDataUrl),
		isExisting: true,
		hasExistingImage: Boolean(room.imageDataUrl),
		hasExistingFloorPlan: Boolean(room.floorPlanDataUrl),
		imageDataUrl: room.imageDataUrl,
		floorPlanDataUrl: room.floorPlanDataUrl,
	}));

	const [projectName, setProjectName] = useState(project.name);
	const [projectDescription, setProjectDescription] = useState(
		project.description ?? "",
	);
	const [projectFloorPlan, setProjectFloorPlan] = useState<File | undefined>();
	const [rooms, setRooms] = useState<RoomForm[]>(initialRooms);
	const [openRooms, setOpenRooms] = useState<string[]>(
		initialRooms.map((room) => room.id),
	);
	const [deletedRoomIds, setDeletedRoomIds] = useState<string[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleRoomUpdate = (roomId: string, update: Partial<RoomForm>) => {
		setRooms((prev) =>
			prev.map((room) => (room.id === roomId ? { ...room, ...update } : room)),
		);
	};

	const handleAddRoom = () => {
		const hasProjectDefault =
			Boolean(projectFloorPlan) || Boolean(projectDefaultFloorPlanUrl);
		const room = {
			...newRoom(),
			floorPlan: projectFloorPlan,
			useProjectPlan: hasProjectDefault,
		};
		setRooms((prev) => [...prev, room]);
		setOpenRooms((prev) => [...prev, room.id]);
	};

	const handleRemoveRoom = (roomId: string) => {
		setRooms((prev) => {
			const room = prev.find((r) => r.id === roomId);
			if (room?.isExisting) {
				setDeletedRoomIds((ids) => [...ids, roomId]);
			}
			return prev.filter((r) => r.id !== roomId);
		});
	};

	const confirmRemoveRoom = (roomId: string) => {
		if (rooms.length === 1) return;
		const confirmed = window.confirm("Remove this room?");
		if (!confirmed) return;
		setOpenRooms((prev) => prev.filter((id) => id !== roomId));
		handleRemoveRoom(roomId);
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
		const hasProjectDefault =
			Boolean(projectFloorPlan) || Boolean(projectDefaultFloorPlanUrl);

		rooms.forEach((room, idx) => {
			if (!room.name.trim()) {
				nextErrors.push(`Room ${idx + 1}: name is required.`);
			}
			if (room.image) {
				if (!isImageFile(room.image)) {
					nextErrors.push(`Room ${idx + 1}: image must be an image file.`);
				} else if (room.image.size > MAX_FILE_BYTES) {
					nextErrors.push(`Room ${idx + 1}: image must be at most 10MB.`);
				}
			}
			if (!room.type) {
				nextErrors.push(`Room ${idx + 1}: type is required.`);
			}
			const selectedFloorPlan =
				room.floorPlan ??
				(room.useProjectPlan ? projectFloorPlan : undefined) ??
				(room.useProjectPlan && hasProjectDefault
					? ("PROJECT_DEFAULT" as unknown as File)
					: undefined);
			const hasExistingPlan =
				room.hasExistingFloorPlan &&
				!room.floorPlan &&
				!(
					room.useProjectPlan &&
					(projectFloorPlan || projectDefaultFloorPlanUrl)
				);
			if (!selectedFloorPlan && !hasExistingPlan) {
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
		formData.set("description", projectDescription.trim());
		if (projectFloorPlan) {
			formData.set("projectFloorPlan", projectFloorPlan);
		}
		if (!projectFloorPlan && initialHasProjectDefaultFloorPlan) {
			formData.set("projectFloorPlanRemoved", "true");
		}

		formData.set(
			"rooms",
			JSON.stringify(
				rooms.map((room) => ({
					id: room.id,
					name: room.name.trim(),
					type: room.type,
					description: room.description?.trim(),
					useProjectPlan: room.useProjectPlan,
				})),
			),
		);

		formData.set("deletedRoomIds", JSON.stringify(deletedRoomIds));

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
			const response = await fetch(`/api/projects/${project.id}`, {
				method: "PUT",
				body: formData,
				credentials: "include",
			});

			if (!response.ok) {
				const data = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error || "Failed to update project");
			}

			const data = (await response.json()) as { projectId: string };
			setSubmittedProjectId(data.projectId);
			await navigate({
				to: "/dashboard/projects/$id",
				params: { id: data.projectId },
				replace: true,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		const confirmed = window.confirm(
			"Delete this project? All rooms and files will be removed.",
		);
		if (!confirmed) return;

		setDeleteError(null);
		setIsDeleting(true);

		try {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				const data = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error || "Failed to delete project");
			}

			await navigate({
				to: "/dashboard/home",
				replace: true,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			setDeleteError(message);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleOpenPreview = (
		event: React.MouseEvent,
		file?: File,
		dataUrl?: string | null,
	) => {
		event.stopPropagation();
		// If we already have a data URL, let the native anchor navigation happen.
		if (!file && dataUrl) {
			return;
		}
		// If we have a File (just uploaded), create an object URL and open it.
		if (file) {
			event.preventDefault();
			const url = URL.createObjectURL(file);
			window.open(url, "_blank", "noopener,noreferrer");
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			return;
		}
		// No file or data URL: cancel navigation.
		event.preventDefault();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-black dark:text-white">
						Edit Project
					</h1>
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						Update project details, manage rooms, and replace floor plans or
						images. Existing files stay unchanged unless you upload a new one.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link to="/dashboard/projects/$id" params={{ id: project.id }}>
						<Button variant="outline">View project</Button>
					</Link>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isSubmitting || isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete project"}
					</Button>
				</div>
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
						<Label htmlFor="project-description">
							Project description (optional)
						</Label>
						<textarea
							id="project-description"
							placeholder="Add context, goals, materials, or constraints"
							value={projectDescription}
							onChange={(e) => setProjectDescription(e.target.value)}
							className="min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-input focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div>
								<Label>Project floor plan (PDF/image)</Label>
								<p className="text-xs text-neutral-500 dark:text-neutral-400">
									Uploading here will copy the floor plan file to all rooms
									without a floor plan.
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
								containerClassName="min-h-[260px]"
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
											prev.map((room) => {
												if (room.floorPlan) return room;
												if (room.useProjectPlan === false) return room;
												return {
													...room,
													floorPlan: file,
													useProjectPlan: true,
												};
											}),
										);
										return;
									}

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
					<Accordion
						type="multiple"
						value={openRooms}
						onValueChange={(values) => setOpenRooms(values)}
						className="space-y-4"
					>
						{rooms.map((room, index) => (
							<AccordionItem
								key={room.id}
								value={room.id}
								className="rounded-lg border border-neutral-200 px-4 dark:border-neutral-800"
							>
								<AccordionTrigger className="py-3 text-left">
									<div className="flex w-full items-center justify-between gap-3">
										<div className="flex flex-col text-sm text-neutral-800 dark:text-neutral-200">
											<span className="font-medium">
												Room {index + 1} — {room.name || "Untitled"}
											</span>
											<span className="text-xs text-neutral-500 dark:text-neutral-400">
												{room.isExisting
													? "Existing room — leave files empty to keep current ones."
													: "New room — floor plan required."}
											</span>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="text-destructive"
											disabled={rooms.length === 1}
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												confirmRemoveRoom(room.id);
											}}
										>
											Remove
										</Button>
									</div>
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<Label htmlFor={`room-name-${room.id}`}>
												Room name *
											</Label>
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
										<div>
											<Label htmlFor={`room-type-${room.id}`}>
												Room type *
											</Label>
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

									<div className="mt-6">
										<Label htmlFor={`room-description-${room.id}`}>
											Room description (optional)
										</Label>
										<textarea
											id={`room-description-${room.id}`}
											placeholder="Style, materials, measurements, must-keep items..."
											value={room.description ?? ""}
											onChange={(e) =>
												handleRoomUpdate(room.id, {
													description: e.target.value,
												})
											}
											className="min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-input focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
										/>
									</div>

									<div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
										<div>
											<Label>Room image (optional)</Label>
											<div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
												{room.imageDataUrl && (
													<div className="mb-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
														<p>Current image:</p>
														<div className="flex gap-3">
															{isLikelyImageUrl(room.imageDataUrl) && (
																<img
																	src={room.imageDataUrl}
																	alt={`Room ${index + 1} current preview`}
																	className="h-24 w-24 rounded object-cover border border-neutral-200 dark:border-neutral-800"
																/>
															)}
															<a
																href={room.imageDataUrl || undefined}
																target="_blank"
																rel="noopener noreferrer"
																onClick={(e) =>
																	handleOpenPreview(
																		e,
																		room.image,
																		room.imageDataUrl,
																	)
																}
																className="self-start text-blue-600 underline dark:text-blue-400"
															>
																View
															</a>
														</div>
													</div>
												)}
												<FileUpload
													key={`room-image-${room.id}`}
													id={`room-image-input-${room.id}`}
													containerClassName="min-h-[220px]"
													accept={{
														"image/png": [],
														"image/jpeg": [],
														"image/webp": [],
													}}
													onChange={(files) => {
														const file = files[0];
														handleRoomUpdate(room.id, { image: file });
													}}
												/>
												{room.image && (
													<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
														Selected: {room.image.name} (
														{(room.image.size / (1024 * 1024)).toFixed(2)} MB)
													</p>
												)}
												<p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
													Leave empty to keep the current image.
												</p>
											</div>
										</div>
										<div>
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
												{room.floorPlanDataUrl && (
													<div className="mb-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
														<p>Current floor plan:</p>
														<div className="flex gap-3">
															{isLikelyImageUrl(room.floorPlanDataUrl) && (
																<img
																	src={room.floorPlanDataUrl}
																	alt={`Room ${index + 1} current plan preview`}
																	className="h-24 w-24 rounded object-cover border border-neutral-200 dark:border-neutral-800"
																/>
															)}
															<a
																href={room.floorPlanDataUrl || undefined}
																target="_blank"
																rel="noopener noreferrer"
																onClick={(e) =>
																	handleOpenPreview(
																		e,
																		room.floorPlan,
																		room.floorPlanDataUrl,
																	)
																}
																className="self-start text-blue-600 underline dark:text-blue-400"
															>
																View
															</a>
														</div>
													</div>
												)}
												{!room.floorPlanDataUrl &&
													!room.floorPlan &&
													room.useProjectPlan &&
													projectDefaultFloorPlanUrl && (
														<div className="mb-3 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
															<p>Current floor plan (project default):</p>
															<div className="flex gap-3">
																{isLikelyImageUrl(
																	projectDefaultFloorPlanUrl,
																) && (
																	<img
																		src={projectDefaultFloorPlanUrl}
																		alt={`Room ${index + 1} project default plan`}
																		className="h-24 w-24 rounded object-cover border border-neutral-200 dark:border-neutral-800"
																	/>
																)}
																<a
																	href={projectDefaultFloorPlanUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	onClick={(e) =>
																		handleOpenPreview(
																			e,
																			room.floorPlan,
																			projectDefaultFloorPlanUrl,
																		)
																	}
																	className="self-start text-blue-600 underline dark:text-blue-400"
																>
																	View
																</a>
															</div>
														</div>
													)}
												<p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
													Use a floor plan for this room or add a project floor
													plan above to copy to rooms
												</p>
												<FileUpload
													key={`room-floorplan-${room.id}`}
													id={`room-floorplan-input-${room.id}`}
													containerClassName="min-h-[220px]"
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
																: Boolean(
																		projectFloorPlan ||
																			projectDefaultFloorPlanUrl,
																	),
															hasExistingFloorPlan:
																room.hasExistingFloorPlan && !file
																	? room.hasExistingFloorPlan
																	: room.hasExistingFloorPlan,
														});
													}}
												/>
												{room.floorPlan ? (
													<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
														Selected: {room.floorPlan.name} (
														{(room.floorPlan.size / (1024 * 1024)).toFixed(2)}{" "}
														MB)
													</p>
												) : null}
												{!room.floorPlan &&
													room.useProjectPlan &&
													(projectFloorPlan || projectDefaultFloorPlanUrl) && (
														<p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
															{projectFloorPlan
																? `Using project floor plan: ${projectFloorPlan.name}`
																: projectDefaultFloorPlanName
																	? `Using project floor plan: ${projectDefaultFloorPlanName}`
																	: "Using project floor plan"}
														</p>
													)}
												<p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
													Leave empty to keep the current floor plan.
												</p>
											</div>
										</div>
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
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
					<Button type="submit" disabled={isSubmitting || isDeleting}>
						{isSubmitting ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</form>

			{submittedProjectId && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950">
					Project updated successfully (id: {submittedProjectId}).
				</div>
			)}
			{deleteError && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950">
					{deleteError}
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

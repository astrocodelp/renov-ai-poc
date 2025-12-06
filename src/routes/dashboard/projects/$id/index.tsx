import {
	createFileRoute,
	getRouteApi,
	Link,
	useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

import { generateRoomImage, type ProjectDetail } from "./route";

type RenovationStatus = "idle" | "submitting" | "success" | "error";
type RenovationRequest = {
	style: string;
	prompt: string;
	status: RenovationStatus;
	message?: string;
	generatedImageDataUrl?: string;
};

const dataUrlToObjectUrl = (dataUrl: string, fallbackMime?: string) => {
	if (!dataUrl.startsWith("data:")) return dataUrl;
	const [meta, content] = dataUrl.split(",");
	const mime =
		meta.match(/data:([^;]+)/)?.[1] ?? fallbackMime ?? "application/pdf";
	const isBase64 = meta.includes(";base64");
	const binary = isBase64 ? atob(content) : decodeURIComponent(content);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const blob = new Blob([bytes], { type: mime });
	return URL.createObjectURL(blob);
};

const STYLE_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
	{
		value: "modern",
		label: "Modern",
		hint: "Clean lines, minimal ornamentation, smooth surfaces.",
	},
	{
		value: "contemporary",
		label: "Contemporary",
		hint: "Comfort-forward, current trends with bold accents.",
	},
	{
		value: "minimalist",
		label: "Minimalist",
		hint: "Extreme simplicity, neutral tones, essentials only.",
	},
	{
		value: "scandinavian",
		label: "Scandinavian",
		hint: "Light, airy, warm wood, natural light, cozy textures.",
	},
	{
		value: "industrial",
		label: "Industrial",
		hint: "Raw warehouse feel, concrete, brick, metal.",
	},
	{
		value: "rustic",
		label: "Rustic",
		hint: "Warm, natural, earthy materials and textures.",
	},
	{
		value: "farmhouse",
		label: "Farmhouse",
		hint: "Cozy, country charm with vintage touches.",
	},
	{
		value: "modern_farmhouse",
		label: "Modern Farmhouse",
		hint: "Rustic warmth meets modern clean lines.",
	},
	{
		value: "traditional",
		label: "Traditional",
		hint: "Classic European symmetry and detailed woodwork.",
	},
	{
		value: "transitional",
		label: "Transitional",
		hint: "Balanced blend of traditional and modern.",
	},
	{
		value: "mediterranean",
		label: "Mediterranean",
		hint: "Warm colors, arches, tile, wrought iron details.",
	},
	{
		value: "bohemian",
		label: "Bohemian (Boho)",
		hint: "Relaxed, eclectic, layered textiles and color.",
	},
	{
		value: "mid_century_modern",
		label: "Mid-Century Modern",
		hint: "1950s–60s lines, tapered legs, bold geometry.",
	},
	{
		value: "japandi",
		label: "Japandi",
		hint: "Japanese minimalism with Scandinavian warmth.",
	},
	{
		value: "japanese_zen",
		label: "Japanese Zen",
		hint: "Calming balance with natural materials.",
	},
	{
		value: "art_deco",
		label: "Art Deco",
		hint: "Glamorous geometry, metallic accents.",
	},
	{
		value: "urban_loft",
		label: "Urban / Modern Loft",
		hint: "City-inspired, industrial touches, open layouts.",
	},
	{
		value: "coastal",
		label: "Coastal / Beach House",
		hint: "Light, breezy, whites and blues, natural textures.",
	},
	{
		value: "french_country",
		label: "French Country",
		hint: "Soft, romantic rustic with carved wood, pastels.",
	},
	{
		value: "eclectic",
		label: "Eclectic",
		hint: "Curated mix of styles, bold combinations.",
	},
	{
		value: "maximalist",
		label: "Maximalist",
		hint: "Layered patterns, vibrant colors, more is more.",
	},
	{
		value: "minimalist_luxury",
		label: "Minimalist Luxury",
		hint: "High-end materials with spacious simplicity.",
	},
	{
		value: "tropical",
		label: "Tropical",
		hint: "Greenery, bamboo, warm rainforest palette.",
	},
	{
		value: "victorian",
		label: "Victorian",
		hint: "Ornate, decorative, rich colors and patterns.",
	},
	{
		value: "moroccan",
		label: "Moroccan",
		hint: "Bold geometric tilework, vibrant colors, lanterns.",
	},
];

// Get access to the parent route's loader data
const parentRoute = getRouteApi("/dashboard/projects/$id");

export const Route = createFileRoute("/dashboard/projects/$id/")({
	component: ProjectDetailPage,
});

function ProjectDetailPage() {
	// Use the parent route's loader data
	const project = parentRoute.useLoaderData() as ProjectDetail;
	const router = useRouter();

	const [pdfPreviewUrls, setPdfPreviewUrls] = useState<Record<string, string>>(
		{},
	);
	const [renovationRequests, setRenovationRequests] = useState<
		Record<string, RenovationRequest>
	>(() =>
		Object.fromEntries(
			project.rooms.map((room) => [
				room.id,
				{
					style: STYLE_OPTIONS[0]?.value ?? "modern",
					prompt: "",
					status: room.generatedImageDataUrl ? "success" : "idle",
					generatedImageDataUrl: room.generatedImageDataUrl ?? undefined,
				},
			]),
		),
	);

	useEffect(() => {
		const urls: Array<[string, string]> = [];
		const revoke: string[] = [];

		project.rooms.forEach((room) => {
			const isPdf =
				room.floorPlanMimeType?.toLowerCase().includes("pdf") ||
				room.floorPlanDataUrl?.startsWith("data:application/pdf");

			if (isPdf && room.floorPlanDataUrl) {
				const url = dataUrlToObjectUrl(
					room.floorPlanDataUrl,
					room.floorPlanMimeType ?? undefined,
				);
				if (url.startsWith("blob:")) revoke.push(url);
				urls.push([room.id, url]);
			}
		});

		setPdfPreviewUrls(Object.fromEntries(urls));

		return () => {
			for (const url of revoke) {
				URL.revokeObjectURL(url);
			}
		};
	}, [project.rooms]);

	useEffect(() => {
		setRenovationRequests(
			Object.fromEntries(
				project.rooms.map((room) => [
					room.id,
					{
						style: STYLE_OPTIONS[0]?.value ?? "modern",
						prompt: "",
						status: room.generatedImageDataUrl ? "success" : "idle",
						generatedImageDataUrl: room.generatedImageDataUrl ?? undefined,
					},
				]),
			),
		);
	}, [project]);

	const updateRenovation = (
		roomId: string,
		update: Partial<RenovationRequest>,
	) => {
		setRenovationRequests((prev) => ({
			...prev,
			[roomId]: {
				...(prev[roomId] ?? {
					style: STYLE_OPTIONS[0].value,
					prompt: "",
					status: "idle",
				}),
				...update,
			},
		}));
	};

	const handleGenerate = async (roomId: string) => {
		const current = renovationRequests[roomId];
		if (!current?.prompt.trim()) {
			updateRenovation(roomId, {
				status: "error",
				message: "Please add what you want to change before generating.",
			});
			return;
		}

		updateRenovation(roomId, {
			status: "submitting",
			message: "Analyzing room and generating photorealistic renovation...",
		});

		try {
			// Call the server function to generate the image
			const result = await (
				generateRoomImage as unknown as (args: {
					data: {
						roomId: string;
						projectId: string;
						style: string;
						prompt: string;
					};
				}) => Promise<{
					success: boolean;
					generatedImageDataUrl?: string;
					error?: string;
				}>
			)({
				data: {
					roomId,
					projectId: project.id,
					style: current.style,
					prompt: current.prompt,
				},
			});

			if (result.success && result.generatedImageDataUrl) {
				updateRenovation(roomId, {
					status: "success",
					message: "Renovation image generated successfully!",
					generatedImageDataUrl: result.generatedImageDataUrl,
				});
				// Invalidate the route to refresh data
				router.invalidate();
			} else {
				updateRenovation(roomId, {
					status: "error",
					message: result.error ?? "Image generation failed. Please try again.",
				});
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to generate image.";
			updateRenovation(roomId, { status: "error", message });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						Project
					</p>
					<h1 className="text-2xl font-semibold text-black dark:text-white">
						{project.name}
					</h1>
					{project.description ? (
						<p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
							{project.description}
						</p>
					) : null}
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						Updated {new Date(project.updatedAt).toLocaleString()}
					</p>
				</div>
				<Link to="/dashboard/projects/$id/edit" params={{ id: project.id }}>
					<Button variant="outline">Edit project</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Rooms
						<Badge variant="secondary">{project.rooms.length}</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{project.rooms.length === 0 ? (
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							No rooms yet for this project.
						</p>
					) : (
						<Accordion type="multiple" className="space-y-3">
							{project.rooms.map((room) => {
								const request = renovationRequests[room.id] ?? {
									style: STYLE_OPTIONS[0]?.value ?? "modern",
									prompt: "",
									status: "idle" as RenovationStatus,
									generatedImageDataUrl: undefined,
								};

								// Get the generated image from request state or from project data
								const generatedImageUrl =
									request.generatedImageDataUrl || room.generatedImageDataUrl;

								const isPdf =
									room.floorPlanMimeType?.toLowerCase().includes("pdf") ||
									room.floorPlanDataUrl?.startsWith("data:application/pdf");
								const pdfPreviewUrl = isPdf
									? pdfPreviewUrls[room.id]
									: undefined;

								return (
									<AccordionItem
										key={room.id}
										value={room.id}
										className="overflow-hidden  border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
									>
										<AccordionTrigger className="px-4 py-3 cursor-pointer rounded-lg hover:no-underline">
											<div className="flex w-full items-center justify-between gap-4">
												<div className="space-y-1 text-left">
													<p className="text-sm font-medium text-neutral-900 dark:text-white">
														{room.name}
													</p>
													<p className="text-xs text-neutral-500 dark:text-neutral-400">
														Created {new Date(room.createdAt).toLocaleString()}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Badge variant="outline">
														{room.type.replace("_", " ")}
													</Badge>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-800">
											<div className="space-y-4">
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<p className="text-sm font-semibold text-neutral-900 dark:text-white">
															Room overview
														</p>
														{room.description ? (
															<p className="text-sm text-neutral-700 dark:text-neutral-300">
																{room.description}
															</p>
														) : (
															<p className="text-sm text-neutral-500 dark:text-neutral-400">
																No description provided.
															</p>
														)}
													</div>
													<div className="space-y-2">
														<p className="text-sm font-semibold text-neutral-900 dark:text-white">
															Room image
														</p>
														{room.imageDataUrl ? (
															<img
																src={room.imageDataUrl}
																alt={`${room.name} reference`}
																className="h-56 w-full rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
															/>
														) : (
															<p className="text-sm text-neutral-500 dark:text-neutral-400">
																No image uploaded for this room.
															</p>
														)}
													</div>
												</div>

												<div className="space-y-2">
													<p className="text-sm font-semibold text-neutral-900 dark:text-white">
														Floor plan
													</p>
													{room.floorPlanDataUrl ? (
														<div className="space-y-3">
															{isPdf ? (
																pdfPreviewUrl ? (
																	<iframe
																		src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
																		title={`${room.name} floor plan`}
																		className="h-[340px] w-full rounded-lg border border-neutral-200 dark:border-neutral-800"
																		loading="lazy"
																	/>
																) : (
																	<div className="h-[340px] w-full rounded-lg border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900">
																		<p className="text-sm text-neutral-600 dark:text-neutral-300">
																			Unable to preview this PDF floor plan in
																			your browser. You can still download it
																			below.
																		</p>
																	</div>
																)
															) : (
																<img
																	src={room.floorPlanDataUrl}
																	alt={`${room.name} floor plan`}
																	className="h-[340px] w-full rounded-lg border border-neutral-200 object-contain dark:border-neutral-800"
																/>
															)}
															<a
																className="text-sm text-blue-600 underline dark:text-blue-400"
																href={room.floorPlanDataUrl}
																download={`${room.name}-floor-plan`}
															>
																Download floor plan
															</a>
														</div>
													) : (
														<p className="text-sm text-neutral-500 dark:text-neutral-400">
															No floor plan available.
														</p>
													)}
												</div>

												<div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
													<div className="flex items-center justify-between">
														<div>
															<p className="text-sm font-semibold text-neutral-900 dark:text-white">
																Generate renovation
															</p>
															<p className="text-xs text-neutral-600 dark:text-neutral-400">
																Pick a style and describe what you want to
																change. We will generate a photorealistic
																update.
															</p>
														</div>
														{request.status === "success" && (
															<Badge variant="secondary">Queued</Badge>
														)}
													</div>

													<div className="grid gap-4 md:grid-cols-2">
														<div className="space-y-2">
															<label
																className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
																htmlFor={`style-${room.id}`}
															>
																Style
															</label>
															<select
																id={`style-${room.id}`}
																value={request.style}
																onChange={(e) =>
																	updateRenovation(room.id, {
																		style: e.target.value,
																		status: "idle",
																		message: undefined,
																	})
																}
																className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-800 shadow-input focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
															>
																{STYLE_OPTIONS.map((option) => (
																	<option
																		key={option.value}
																		value={option.value}
																	>
																		{option.label} — {option.hint}
																	</option>
																))}
															</select>
														</div>
														<div className="space-y-2">
															<label
																className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
																htmlFor={`prompt-${room.id}`}
															>
																What should change?
															</label>
															<textarea
																id={`prompt-${room.id}`}
																value={request.prompt}
																onChange={(e) =>
																	updateRenovation(room.id, {
																		prompt: e.target.value,
																		status: "idle",
																		message: undefined,
																	})
																}
																placeholder="Ex: Brighten the space, add built-in storage, switch to Japandi palette..."
																className="min-h-[120px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-input focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
															/>
														</div>
													</div>

													<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
														<Button
															type="button"
															variant="default"
															onClick={() => handleGenerate(room.id)}
															disabled={request.status === "submitting"}
														>
															{request.status === "submitting"
																? "Generating..."
																: generatedImageUrl
																	? "Regenerate photo"
																	: "Generate photorealistic photo"}
														</Button>
														{request.message ? (
															<p
																className={`text-xs ${request.status === "error" ? "text-red-600 dark:text-red-400" : request.status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-600 dark:text-neutral-300"}`}
															>
																{request.message}
															</p>
														) : null}
													</div>
												</div>

												{/* Generated Renovation Image */}
												{generatedImageUrl && (
													<div className="space-y-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
														<div className="flex items-center justify-between">
															<div>
																<p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
																	🎨 Generated Renovation
																</p>
																<p className="text-xs text-emerald-700 dark:text-emerald-300">
																	AI-generated photorealistic visualization of
																	your renovated room
																</p>
															</div>
															<Badge
																variant="secondary"
																className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
															>
																AI Generated
															</Badge>
														</div>
														<img
															src={generatedImageUrl}
															width={1024}
															height={720}
															alt={`${room.name} renovation visualization`}
															className="h-auto max-w-[1024px] rounded-lg border border-emerald-200 object-contain shadow-md dark:border-emerald-800"
														/>
														<div className="flex gap-2">
															<a
																className="text-sm text-emerald-600 underline dark:text-emerald-400"
																href={generatedImageUrl}
																download={`${room.name}-renovation.png`}
															>
																Download renovation image
															</a>
														</div>
													</div>
												)}
											</div>
										</AccordionContent>
									</AccordionItem>
								);
							})}
						</Accordion>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

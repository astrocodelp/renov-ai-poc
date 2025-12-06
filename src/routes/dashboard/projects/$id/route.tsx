/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { stepCountIs } from "ai";

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
	generatedImageDataUrl: string | null;
	generatedImageFileName?: string | null;
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

export type GenerateImageInput = {
	roomId: string;
	projectId: string;
	style: string;
	prompt: string;
};

export type GenerateImageResult = {
	success: boolean;
	generatedImageDataUrl?: string;
	error?: string;
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
		const { auth } = await import("@/lib/auth.server");
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session) {
			throw redirect({ to: "/login", replace: true });
		}

		const { prisma } = await import("@/db.server");

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
						generatedImageFile: {
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
				generatedImageFile: {
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
				const generatedImageBuffer = room.generatedImageFile
					? Buffer.from(room.generatedImageFile.bytes)
					: null;
				const generatedImageMime = room.generatedImageFile?.mimeType ?? null;

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
					generatedImageDataUrl: generatedImageBuffer
						? bufferToDataUrl(
								generatedImageBuffer,
								generatedImageMime ?? "image/png",
							)
						: null,
					generatedImageFileName: room.generatedImageFile?.name ?? null,
				};
			}),
		};
	},
);

// Server function to generate a renovated room image using AI
// Calculation tools for floor plan geometry analysis
const calculationTools = {
	calculateArea: {
		description:
			"Calculate the area of a room given width and length in meters",
		parameters: {
			type: "object" as const,
			properties: {
				width: { type: "number", description: "Width of the room in meters" },
				length: { type: "number", description: "Length of the room in meters" },
			},
			required: ["width", "length"],
		},
		execute: async ({ width, length }: { width: number; length: number }) => {
			const area = width * length;
			const sqft = area * 10.764;
			return {
				areaSqm: Math.round(area * 100) / 100,
				areaSqft: Math.round(sqft * 100) / 100,
			};
		},
	},
	calculateFurniturePlacement: {
		description:
			"Calculate optimal furniture placement based on room dimensions and style",
		parameters: {
			type: "object" as const,
			properties: {
				roomWidth: {
					type: "number",
					description: "Room width in meters",
				},
				roomLength: {
					type: "number",
					description: "Room length in meters",
				},
				roomType: {
					type: "string",
					description: "Type of room (living_room, bedroom, kitchen, etc.)",
				},
				style: {
					type: "string",
					description: "Design style for the room",
				},
			},
			required: ["roomWidth", "roomLength", "roomType", "style"],
		},
		execute: async ({
			roomWidth,
			roomLength,
			roomType,
			style,
		}: {
			roomWidth: number;
			roomLength: number;
			roomType: string;
			style: string;
		}) => {
			const area = roomWidth * roomLength;
			const isSmall = area < 15;
			const isMedium = area >= 15 && area < 30;

			// Base furniture suggestions by room type
			const furnitureByType: Record<string, string[]> = {
				living_room: isSmall
					? ["compact sofa", "small coffee table", "floor lamp", "wall shelves"]
					: isMedium
						? [
								"3-seater sofa",
								"coffee table",
								"armchair",
								"TV console",
								"floor lamp",
								"side table",
							]
						: [
								"sectional sofa",
								"large coffee table",
								"2 armchairs",
								"media console",
								"bookshelf",
								"floor lamps",
								"accent table",
							],
				bedroom: isSmall
					? ["double bed", "nightstand", "wall-mounted lamp", "small dresser"]
					: isMedium
						? [
								"queen bed",
								"2 nightstands",
								"dresser",
								"reading chair",
								"floor mirror",
							]
						: [
								"king bed",
								"2 nightstands",
								"dresser",
								"vanity",
								"reading nook",
								"bench",
							],
				kitchen: isSmall
					? ["compact island or cart", "2 bar stools", "wall-mounted storage"]
					: isMedium
						? [
								"kitchen island",
								"4 bar stools",
								"pantry cabinet",
								"open shelving",
							]
						: [
								"large island with seating",
								"6 bar stools",
								"butler's pantry",
								"breakfast nook",
							],
				bathroom: isSmall
					? ["wall-mounted vanity", "mirror cabinet", "towel rack"]
					: isMedium
						? [
								"double vanity",
								"large mirror",
								"storage cabinet",
								"towel warmer",
							]
						: [
								"double vanity",
								"freestanding tub",
								"walk-in shower",
								"seating bench",
							],
				office: isSmall
					? ["compact desk", "ergonomic chair", "wall shelves", "task lamp"]
					: isMedium
						? [
								"L-shaped desk",
								"ergonomic chair",
								"bookcase",
								"guest chair",
								"filing cabinet",
							]
						: [
								"executive desk",
								"ergonomic chair",
								"built-in bookcases",
								"conference area",
								"lounge seating",
							],
				dining_room: isSmall
					? ["round table for 4", "4 dining chairs", "sideboard"]
					: isMedium
						? [
								"rectangular table for 6",
								"6 dining chairs",
								"buffet",
								"bar cart",
							]
						: [
								"large dining table for 8-10",
								"dining chairs",
								"china cabinet",
								"sideboard",
								"bar area",
							],
			};

			const normalizedType = roomType.toLowerCase().replace(" ", "_");
			const furniture =
				furnitureByType[normalizedType] || furnitureByType.living_room;

			// Style-specific modifications
			const styleModifiers: Record<string, string> = {
				modern: "clean lines, minimal ornamentation, neutral tones",
				scandinavian: "light wood, white/beige tones, cozy textiles",
				industrial: "metal accents, exposed materials, dark tones",
				minimalist: "essential pieces only, monochromatic, hidden storage",
				bohemian: "layered textiles, mixed patterns, plants",
				japandi: "natural materials, low furniture, zen aesthetic",
				mid_century_modern: "tapered legs, organic shapes, bold colors",
				traditional: "ornate details, rich wood, classic patterns",
			};

			const styleNote =
				styleModifiers[style.toLowerCase().replace(" ", "_")] ||
				styleModifiers.modern;

			return {
				suggestedFurniture: furniture,
				styleGuidelines: styleNote,
				roomSizeCategory: isSmall ? "small" : isMedium ? "medium" : "large",
				optimalLayout:
					roomWidth > roomLength
						? "horizontal arrangement"
						: "vertical arrangement",
				walkwaySpace: `Maintain at least ${isSmall ? "0.6m" : "0.9m"} clearance for walkways`,
			};
		},
	},
	calculateLightingNeeds: {
		description: "Calculate lighting requirements based on room size and type",
		parameters: {
			type: "object" as const,
			properties: {
				areaSqm: { type: "number", description: "Room area in square meters" },
				roomType: { type: "string", description: "Type of room" },
				naturalLight: {
					type: "string",
					enum: ["low", "medium", "high"],
					description: "Amount of natural light",
				},
			},
			required: ["areaSqm", "roomType"],
		},
		execute: async ({
			areaSqm,
			roomType,
			naturalLight = "medium",
		}: {
			areaSqm: number;
			roomType: string;
			naturalLight?: string;
		}) => {
			// Lux requirements by room type
			const luxByType: Record<string, number> = {
				living_room: 300,
				bedroom: 200,
				kitchen: 500,
				bathroom: 400,
				office: 500,
				dining_room: 300,
			};

			const normalizedType = roomType.toLowerCase().replace(" ", "_");
			const requiredLux = luxByType[normalizedType] || 300;

			// Adjust for natural light
			const lightMultiplier =
				naturalLight === "high" ? 0.7 : naturalLight === "low" ? 1.3 : 1;
			const adjustedLux = requiredLux * lightMultiplier;

			// Calculate lumens needed (area * lux)
			const totalLumens = areaSqm * adjustedLux;

			// Suggest number of light sources (assuming 800 lumens per source average)
			const lightSources = Math.ceil(totalLumens / 800);

			return {
				requiredLux: Math.round(adjustedLux),
				totalLumensNeeded: Math.round(totalLumens),
				suggestedLightSources: lightSources,
				recommendation: `Install ${lightSources} light sources providing ${Math.round(totalLumens / lightSources)} lumens each. Consider layered lighting: ambient (${Math.ceil(lightSources * 0.5)}), task (${Math.ceil(lightSources * 0.3)}), accent (${Math.ceil(lightSources * 0.2)}).`,
			};
		},
	},
	calculateColorPalette: {
		description: "Generate a color palette based on style and room type",
		parameters: {
			type: "object" as const,
			properties: {
				style: { type: "string", description: "Design style" },
				roomType: { type: "string", description: "Type of room" },
				preferWarm: {
					type: "boolean",
					description: "Whether to prefer warm tones",
				},
			},
			required: ["style", "roomType"],
		},
		execute: async ({
			style,
			roomType: _roomType,
			preferWarm = true,
		}: {
			style: string;
			roomType: string;
			preferWarm?: boolean;
		}) => {
			void _roomType; // Used in schema, will be relevant for future room-specific palettes
			const palettes: Record<
				string,
				{ primary: string; secondary: string; accent: string; neutral: string }
			> = {
				modern: {
					primary: preferWarm ? "#2C3E50" : "#34495E",
					secondary: preferWarm ? "#ECF0F1" : "#BDC3C7",
					accent: preferWarm ? "#E74C3C" : "#3498DB",
					neutral: "#FFFFFF",
				},
				scandinavian: {
					primary: "#FFFFFF",
					secondary: "#F5F5DC",
					accent: preferWarm ? "#8B7355" : "#87CEEB",
					neutral: "#D3D3D3",
				},
				industrial: {
					primary: "#36454F",
					secondary: "#708090",
					accent: "#CD7F32",
					neutral: "#A9A9A9",
				},
				minimalist: {
					primary: "#FFFFFF",
					secondary: "#F5F5F5",
					accent: "#000000",
					neutral: "#E0E0E0",
				},
				bohemian: {
					primary: "#8B4513",
					secondary: "#DEB887",
					accent: preferWarm ? "#FF6347" : "#20B2AA",
					neutral: "#F5DEB3",
				},
				japandi: {
					primary: "#F5F5DC",
					secondary: "#8B7355",
					accent: "#2F4F4F",
					neutral: "#D2B48C",
				},
				mid_century_modern: {
					primary: "#F5DEB3",
					secondary: "#8B4513",
					accent: preferWarm ? "#FF8C00" : "#4169E1",
					neutral: "#FFF8DC",
				},
				traditional: {
					primary: "#800020",
					secondary: "#DAA520",
					accent: "#006400",
					neutral: "#F5F5DC",
				},
			};

			const normalizedStyle = style.toLowerCase().replace(" ", "_");
			const palette = palettes[normalizedStyle] || palettes.modern;

			return {
				colorPalette: palette,
				usage: {
					walls: `Primary (${palette.primary}) for main walls, Secondary (${palette.secondary}) for accent walls`,
					furniture: `Mix of Neutral (${palette.neutral}) for large pieces, Accent (${palette.accent}) for statement pieces`,
					textiles: `Secondary (${palette.secondary}) for curtains/rugs, Accent (${palette.accent}) for pillows/throws`,
					accessories: `Accent (${palette.accent}) for art and decorative objects`,
				},
			};
		},
	},
};

export const generateRoomImage = createServerFn({ method: "POST" }).handler(
	// @ts-expect-error server fn ctx typing friction
	async ({
		request,
		data,
	}: {
		request: Request;
		data: GenerateImageInput;
	}): Promise<GenerateImageResult> => {
		const { roomId, projectId, style, prompt } = data;

		// Auth check
		const { auth } = await import("@/lib/auth.server");
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session) {
			return { success: false, error: "Unauthorized" };
		}

		// Get API key from cookie or fallback to env
		const cookieHeader = request.headers.get("cookie") ?? "";
		const cookies = Object.fromEntries(
			cookieHeader.split("; ").map((c) => {
				const [key, ...val] = c.split("=");
				return [key, val.join("=")];
			}),
		);
		const apiKey =
			cookies.OPENROUTER_API_KEY ||
			(await import("@/env")).env.OPENROUTER_API_KEY;

		console.log("apiKey", apiKey);

		if (!apiKey) {
			return {
				success: false,
				error:
					"OpenRouter API key not found. Please set it in Settings or contact support.",
			};
		}

		const { prisma } = await import("@/db.server");

		// Verify ownership and get room data
		const room = (await prisma.room.findFirst({
			where: {
				id: roomId,
				projectId,
				project: { ownerId: session.user.id },
			},
			select: {
				id: true,
				name: true,
				description: true,
				type: true,
				geometry: true,
				floorPlanFile: {
					select: { bytes: true, mimeType: true },
				},
				imageFile: {
					select: { bytes: true, mimeType: true },
				},
				project: {
					select: { name: true, description: true },
				},
			},
			// biome-ignore lint/suspicious/noExplicitAny: Prisma typing friction
		} as any)) as {
			id: string;
			name: string;
			description: string | null;
			type: string;
			geometry: Record<string, unknown> | null;
			floorPlanFile: { bytes: Buffer; mimeType: string };
			imageFile: { bytes: Buffer; mimeType: string } | null;
			project: { name: string; description: string | null };
		} | null;

		if (!room) {
			return { success: false, error: "Room not found" };
		}

		try {
			// Import AI SDK and OpenRouter provider
			const { generateText, tool } = await import("ai");
			const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
			const { z } = await import("zod");

			const openrouter = createOpenRouter({ apiKey });

			// Build context messages for the AI
			const contextParts: string[] = [];
			contextParts.push(`Project: ${room.project.name}`);
			if (room.project.description) {
				contextParts.push(`Project Description: ${room.project.description}`);
			}
			contextParts.push(`Room: ${room.name} (${room.type.replace("_", " ")})`);
			if (room.description) {
				contextParts.push(`Room Description: ${room.description}`);
			}
			contextParts.push(`Desired Style: ${style}`);
			contextParts.push(`User Request: ${prompt}`);

			// Prepare image parts for vision model
			const imageParts: Array<{
				type: "image";
				image: string;
				mimeType?: string;
			}> = [];

			// Add floor plan as image if it's an image type (not PDF)
			const floorPlanMime = room.floorPlanFile.mimeType.toLowerCase();
			let floorPlanBase64 = "";
			if (
				floorPlanMime.startsWith("image/") ||
				floorPlanMime === "application/pdf"
			) {
				floorPlanBase64 = Buffer.from(room.floorPlanFile.bytes).toString(
					"base64",
				);
				if (floorPlanMime.startsWith("image/")) {
					imageParts.push({
						type: "image",
						image: floorPlanBase64,
						mimeType: floorPlanMime,
					});
				}
			}

			// Add current room image if available
			let roomImageBase64 = "";
			if (room.imageFile) {
				roomImageBase64 = Buffer.from(room.imageFile.bytes).toString("base64");
				imageParts.push({
					type: "image",
					image: roomImageBase64,
					mimeType: room.imageFile.mimeType,
				});
			}

			console.log("Step 1: Analyzing floor plan geometry with Gemini 3 Pro...");

			// STEP 1: Analyze floor plan geometry using Gemini 3 Pro Preview with tools
			const geometryAnalysisPrompt = `You are an expert architect and interior designer. Analyze the provided floor plan image to extract precise geometric information about the room.

Context:
${contextParts.join("\n")}

Your task:
1. Identify the room dimensions (width and length) from the floor plan - estimate in meters if scale is not provided
2. Identify doors, windows, and their positions
3. Note any architectural features (columns, alcoves, built-ins)
4. Assess natural light potential based on window placement

Use the available tools to:
- Calculate the room area using calculateArea
- Determine optimal furniture placement using calculateFurniturePlacement
- Calculate lighting needs using calculateLightingNeeds
- Generate a color palette using calculateColorPalette

After using all relevant tools, provide a comprehensive analysis summary.`;

			// Define tools for the geometry analysis agent
			const geometryTools = {
				calculateArea: tool({
					description: calculationTools.calculateArea.description,
					parameters: z.object({
						width: z.number().describe("Width of the room in meters"),
						length: z.number().describe("Length of the room in meters"),
					}),
					// @ts-expect-error tool typing friction
					execute: calculationTools.calculateArea.execute,
				}),
				calculateFurniturePlacement: tool({
					description: calculationTools.calculateFurniturePlacement.description,
					parameters: z.object({
						roomWidth: z.number().describe("Room width in meters"),
						roomLength: z.number().describe("Room length in meters"),
						roomType: z.string().describe("Type of room"),
						style: z.string().describe("Design style for the room"),
					}),
					// @ts-expect-error tool typing friction
					execute: calculationTools.calculateFurniturePlacement.execute,
				}),
				calculateLightingNeeds: tool({
					description: calculationTools.calculateLightingNeeds.description,
					parameters: z.object({
						areaSqm: z.number().describe("Room area in square meters"),
						roomType: z.string().describe("Type of room"),
						naturalLight: z
							.enum(["low", "medium", "high"])
							.optional()
							.describe("Amount of natural light"),
					}),
					// @ts-expect-error tool typing friction
					execute: calculationTools.calculateLightingNeeds.execute,
				}),
				calculateColorPalette: tool({
					description: calculationTools.calculateColorPalette.description,
					parameters: z.object({
						style: z.string().describe("Design style"),
						roomType: z.string().describe("Type of room"),
						preferWarm: z
							.boolean()
							.optional()
							.describe("Whether to prefer warm tones"),
					}),
					// @ts-expect-error tool typing friction
					execute: calculationTools.calculateColorPalette.execute,
				}),
			};

			// Run geometry analysis with tool calling using Gemini 3 Pro
			const geometryAnalysis = await generateText({
				model: openrouter("google/gemini-3-pro-preview"),
				tools: geometryTools,
				stopWhen: stepCountIs(10),
				messages: [
					{
						role: "user",
						content:
							imageParts.length > 0
								? [
										{ type: "text", text: geometryAnalysisPrompt },
										...imageParts.map((img) => ({
											type: "image" as const,
											image: img.image,
											mimeType: img.mimeType,
										})),
									]
								: geometryAnalysisPrompt,
					},
				],
				providerOptions: {
					// add low reasoning to the provider options
					google: {
						thinkingConfig: {
							thinkingLevel: "low",
							includeThoughts: true,
						},
					},
				},
			});

			// Collect tool results for context from the steps
			const toolResults: Record<string, unknown> = {};
			for (const step of geometryAnalysis.steps || []) {
				for (const toolResult of step.toolResults || []) {
					// Access the result using type assertion - AI SDK types can vary
					const resultData =
						(toolResult as { toolName: string; result?: unknown }).result ??
						toolResult;
					toolResults[toolResult.toolName] = resultData;
				}
			}

			console.log("Tool results:", JSON.stringify(toolResults, null, 2));
			console.log("Geometry analysis:", geometryAnalysis.text);

			// Save geometry data to the room if we got useful calculations
			if (Object.keys(toolResults).length > 0) {
				await prisma.room.update({
					where: { id: roomId },
					data: {
						geometry: {
							...((room.geometry as Record<string, unknown>) || {}),
							...toolResults,
							analysisTimestamp: new Date().toISOString(),
						},
					} as any,
				});
			}

			console.log(
				"Step 2: Creating detailed image prompt based on analysis...",
			);

			// STEP 2: Create a detailed image generation prompt based on the analysis
			const imagePromptCreationRequest = `Based on the following floor plan geometry analysis and room context, create a detailed prompt for generating a photorealistic interior design rendering.

CRITICAL CONSTRAINT: The generated image MUST maintain the EXACT SAME camera angle, perspective, and viewpoint as the reference room photo. The camera position cannot change - only describe what elements in the room should be modified.

GEOMETRY ANALYSIS:
${geometryAnalysis.text}

TOOL CALCULATION RESULTS:
${JSON.stringify(toolResults, null, 2)}

ROOM CONTEXT:
${contextParts.join("\n")}

Create a detailed, vivid prompt describing ONLY the changes to apply to the room while keeping the exact same camera view. The prompt should:
1. NEVER mention changing the camera angle, position, or perspective - assume the exact same viewpoint
2. Describe what furniture to add/change based on the calculated recommendations
3. Define the color palette using the calculated colors for walls, floors, and furnishings
4. Describe lighting fixtures and their effects (but keep natural light direction unchanged)
5. Incorporate the "${style}" design style with specific materials and textures
6. Address the user's specific request: "${prompt}"
7. Describe specific furniture pieces, materials, and decorative elements to place in the scene
8. Mention specific brands or designer references if appropriate for the style

IMPORTANT: Do NOT describe the camera or viewing angle. Write the prompt as if you're describing renovations to a room photo that will keep its original perspective. Start directly with the room transformation description.`;

			const promptCreation = await generateText({
				model: openrouter("google/gemini-3-pro-preview"),
				messages: [
					{
						role: "user",
						content: imagePromptCreationRequest,
					},
				],
				maxOutputTokens: 1500,
			});

			const detailedImagePrompt = promptCreation.text;
			console.log("Generated image prompt:", detailedImagePrompt);

			console.log(
				"Step 3: Generating photorealistic image with Gemini 3 Pro Image...",
			);

			// STEP 3: Generate the image using OpenRouter API with Gemini 3 Pro Image
			// Note: AI SDK's experimental_generateImage requires providers with .image() method
			// OpenRouter doesn't expose this, so we use their direct chat completions API
			// with modalities: ["text", "image"] to get image output

			const finalImagePrompt = `CRITICAL INSTRUCTION: You MUST preserve the EXACT same camera angle, perspective, viewpoint, and composition as the reference image provided. Do NOT change the camera position, field of view, or framing in any way. The output image must look like it was taken from the IDENTICAL position and angle as the input photo.

WHAT TO KEEP UNCHANGED:
- Camera angle and position (do not move the camera)
- Perspective and field of view
- Room structure, walls, windows, doors positions
- Overall composition and framing
- Lighting direction and shadows placement

WHAT TO CHANGE (based on user request):
${detailedImagePrompt}

OUTPUT REQUIREMENTS:
- Photorealistic interior design rendering
- Professional architectural photography quality, 4K detail
- Realistic lighting and textures
- The viewer should feel they are looking at the SAME room from the SAME position, just renovated
- Suitable for a before/after renovation comparison presentation`;

			console.log(
				"Using OpenRouter API with google/gemini-3-pro-image-preview...",
			);

			// Try Gemini 3 Pro Image via OpenRouter chat completions with image modality
			const geminiImageResponse = await fetch(
				"https://openrouter.ai/api/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
						"HTTP-Referer": "https://renov-ai.app",
						"X-Title": "Renov.ai - Room Renovation Generator",
					},
					body: JSON.stringify({
						model: "google/gemini-3-pro-image-preview",
						messages: [
							{
								role: "user",
								content: [
									{
										type: "text",
										text: finalImagePrompt,
									},
									// Include reference room image if available
									...(roomImageBase64 && room.imageFile
										? [
												{
													type: "image_url",
													image_url: {
														url: `data:${room.imageFile.mimeType};base64,${roomImageBase64}`,
													},
												},
											]
										: []),
								],
							},
						],
						max_tokens: 4096,
						// Request image output modality for Gemini image generation
						modalities: ["text", "image"],
					}),
				},
			);

			if (geminiImageResponse.ok) {
				// OpenRouter image generation response format:
				// https://openrouter.ai/docs/guides/overview/multimodal/image-generation
				// Images are in message.images array, not in content
				const geminiData = (await geminiImageResponse.json()) as {
					choices?: Array<{
						message?: {
							role?: string;
							content?: string;
							// Images are returned in a separate 'images' array per OpenRouter docs
							images?: Array<{
								type: string;
								image_url: { url: string };
							}>;
						};
					}>;
				};

				console.log(
					"Gemini response received:",
					JSON.stringify(geminiData, null, 2),
				);

				// Extract image from OpenRouter response format
				// Per docs: images are in message.images[].image_url.url as base64 data URLs
				const message = geminiData.choices?.[0]?.message;
				let geminiImageBuffer: Buffer | null = null;

				// Check for images in the dedicated 'images' array (OpenRouter format)
				if (message?.images && message.images.length > 0) {
					const imageData = message.images[0];
					if (imageData?.image_url?.url) {
						const url = imageData.image_url.url;
						console.log("Found image in message.images array");

						if (url.startsWith("data:")) {
							// Extract base64 data from data URL
							const base64Data = url.split(",")[1];
							if (base64Data) {
								geminiImageBuffer = Buffer.from(base64Data, "base64");
							}
						} else {
							// Fetch from external URL if not a data URL
							const urlImgResponse = await fetch(url);
							const arrayBuffer = await urlImgResponse.arrayBuffer();
							geminiImageBuffer = Buffer.from(arrayBuffer);
						}
					}
				}

				// Fallback: Check content for inline base64 image (older format)
				if (!geminiImageBuffer && message?.content) {
					const content = message.content;
					if (typeof content === "string") {
						const base64Match = content.match(
							/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/,
						);
						if (base64Match) {
							console.log("Found image in content string (fallback)");
							geminiImageBuffer = Buffer.from(base64Match[1], "base64");
						}
					}
				}

				if (geminiImageBuffer) {
					console.log("Image extracted from Gemini response successfully");

					// Save the generated image to the database
					const savedFile = await prisma.file.create({
						data: {
							name: `${room.name}-renovation-${Date.now()}.png`,
							mimeType: "image/png",
							bytes: new Uint8Array(geminiImageBuffer),
						},
						select: { id: true },
					});

					await prisma.room.update({
						where: { id: roomId },
						// biome-ignore lint/suspicious/noExplicitAny: Prisma typing friction
						data: { generatedImageFileId: savedFile.id } as any,
					});

					return {
						success: true,
						generatedImageDataUrl: bufferToDataUrl(
							geminiImageBuffer,
							"image/png",
						),
					};
				}

				console.log(
					"No image found in Gemini response, falling back to FLUX...",
				);
			} else {
				const errorText = await geminiImageResponse.text();
				console.error("Gemini image generation error:", errorText);
				console.log("Falling back to FLUX for image generation...");
			}

			// Fallback: Try OpenRouter images API with FLUX
			console.log("Using FLUX via OpenRouter images API...");

			const imgResponse = await fetch(
				"https://openrouter.ai/api/v1/images/generations",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
						"HTTP-Referer": "https://renov-ai.app",
						"X-Title": "Renov.ai - Room Renovation Generator",
					},
					body: JSON.stringify({
						model: "black-forest-labs/flux-schnell",
						prompt: finalImagePrompt,
						n: 1,
						size: "1024x1024",
						response_format: "b64_json",
					}),
				},
			);

			if (!imgResponse.ok) {
				const fluxError = await imgResponse.text();
				console.error("FLUX image generation error:", fluxError);
				return {
					success: false,
					error: `Image generation failed: ${imgResponse.status} - ${fluxError}`,
				};
			}

			// Parse FLUX response
			const fluxData = (await imgResponse.json()) as {
				data?: Array<{ b64_json?: string; url?: string }>;
			};

			if (!fluxData.data?.[0]?.b64_json && !fluxData.data?.[0]?.url) {
				return {
					success: false,
					error: "Image generation failed - no image returned from FLUX",
				};
			}

			let fallbackImageBuffer: Buffer;
			if (fluxData.data[0].b64_json) {
				fallbackImageBuffer = Buffer.from(fluxData.data[0].b64_json, "base64");
			} else if (fluxData.data[0].url) {
				const imageUrlResponse = await fetch(fluxData.data[0].url);
				const arrayBuffer = await imageUrlResponse.arrayBuffer();
				fallbackImageBuffer = Buffer.from(arrayBuffer);
			} else {
				return {
					success: false,
					error: "Image generation failed - invalid FLUX response format",
				};
			}

			// Save the generated image to the database
			const savedFile = await prisma.file.create({
				data: {
					name: `${room.name}-renovation-${Date.now()}.png`,
					mimeType: "image/png",
					bytes: new Uint8Array(fallbackImageBuffer),
				},
				select: { id: true },
			});

			// Update the room with the generated image
			await prisma.room.update({
				where: { id: roomId },
				// biome-ignore lint/suspicious/noExplicitAny: Prisma typing friction
				data: { generatedImageFileId: savedFile.id } as any,
			});

			// Return the generated image as data URL
			return {
				success: true,
				generatedImageDataUrl: bufferToDataUrl(
					fallbackImageBuffer,
					"image/png",
				),
			};
		} catch (error) {
			console.error("Image generation error:", error);
			const message =
				error instanceof Error ? error.message : "Image generation failed";
			return { success: false, error: message };
		}
	},
);

function ProjectLayout() {
	return <Outlet />;
}

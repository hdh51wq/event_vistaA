import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Available furniture catalogue for the AI to reference
const FURNITURE_CATALOGUE = [
  { id: "chair",        label: "Chair",        width: 90,  height: 110, price: 75  },
  { id: "sofa",         label: "Sofa",         width: 160, height: 100, price: 450 },
  { id: "table",        label: "Table",        width: 140, height: 100, price: 220 },
  { id: "lamp",         label: "Floor Lamp",   width: 60,  height: 160, price: 120 },
  { id: "plant",        label: "Plant",        width: 80,  height: 130, price: 45  },
  { id: "coffee-table", label: "Coffee Table", width: 130, height: 80,  price: 180 },
  { id: "bookshelf",    label: "Bookshelf",    width: 110, height: 160, price: 250 },
  { id: "flower-vase",  label: "Flower Vase",  width: 70,  height: 130, price: 35  },
  { id: "dining-table", label: "Dining Table", width: 160, height: 110, price: 550 },
];

export interface PlacementSuggestion {
  id: string;           // furniture catalogue id
  label: string;
  quantity: number;
  placements: {
    yaw: number;        // radians, 0 = forward, positive = left
    pitch: number;      // radians, 0 = horizon, positive = up
    facing: "front" | "back" | "left" | "right";
    reasoning: string;  // why this position
  }[];
}

export interface VisualDesignResponse {
  sceneAnalysis: string;          // paragraph describing what the AI sees
  recommendations: PlacementSuggestion[];
  totalEstimatedCost: number;
  designReasoning: string;        // overall design rationale
  layoutStyle: string;            // e.g. "cocktail reception", "seated dinner"
}

type Facing = "front" | "back" | "left" | "right";

const SYSTEM_PROMPT = `You are a world-class event interior designer and scenographer with 20 years of experience designing galas, weddings, and corporate events. You think like a human designer: you consider traffic flow, focal points, social dynamics, and visual balance. You never place a chair facing a wall or door. You never leave a dining table without chairs around it. You never isolate a sofa with no coffee table nearby.

DESIGN RULES YOU MUST FOLLOW:
1. GROUPING: Never place a table without at least 2 chairs around it. Place chairs at yaw offsets of ±0.12 to ±0.18 around every table.
2. FOCAL POINT: Identify the room's main focal point (fireplace, stage, window) from the image and orient seating to face it.
3. TRAFFIC FLOW: Keep yaw=0 (the entrance/main path) clear of large furniture.
4. WALLS: Place tall items (lamps, plants, bookshelves) at high yaw values (±1.5 to ±2.8) near walls, never in the middle of the room.
5. SOCIAL ZONES: Create clusters — a sofa + coffee table + 2 chairs = a conversation zone. A dining table + 4–6 chairs = a dining zone.
6. BALANCE: Distribute furniture on BOTH sides of the room (positive and negative yaw values), not just one side.
7. NO LONELY ITEMS: Every sofa needs a coffee table nearby (±0.10 yaw). Every lamp should be next to a seating group, not isolated.
8. DOORS & PATHS: Never place any furniture at the exact yaw of a visible door or corridor opening.
9. QUANTITY: For a large venue, use 12–20 placements. For small venues, 8–12.
10. REALISM: Think about how a real guest would move through and experience this space.

COORDINATE SYSTEM (CRITICAL — must be exact):
- yaw: horizontal angle in RADIANS. Range: -π to +π. 0 = centre of image (forward). Positive = left, negative = right.
- pitch: vertical angle in RADIANS.
  - Positive pitch values point DOWN towards the floor (use 0.05 to 0.15 range).
  - Negative pitch values point UP towards the ceiling — never use negative pitch.
  - Use pitch +0.10 for standard floor items (chairs, sofas, tables, coffee tables, dining tables, vases).
  - Use pitch +0.05 for tall items (lamps, plants, bookshelves).

AVAILABLE FURNITURE (use only these ids):
${FURNITURE_CATALOGUE.map(f => `- id: "${f.id}" | label: ${f.label} | €${f.price}/unit`).join("\n")}

FACING VALUES: "front", "back", "left", "right" — choose based on how the item should face relative to the viewer.

RESPONSE FORMAT: You MUST respond with a valid JSON object only. No markdown, no extra text.

{
  "sceneAnalysis": "<2-3 sentences describing the room: size, style, features, lighting>",
  "layoutStyle": "<e.g. 'Cocktail Reception', 'Seated Gala Dinner', 'Conference Setup'>",
  "designReasoning": "<2-3 sentences explaining your overall design strategy>",
  "totalEstimatedCost": <number — sum of all unit prices × quantities>,
  "recommendations": [
    {
      "id": "<furniture-id>",
      "label": "<furniture label>",
      "quantity": <number>,
      "placements": [
        {
          "yaw": <number in radians, -π to π>,
          "pitch": <number in radians, typically +0.05 to +0.15 for floor items>,
          "facing": "<front|back|left|right>",
          "reasoning": "<one sentence why this exact position>"
        }
      ]
    }
  ]
}`;

const FLOOR_ITEMS = new Set(["chair", "sofa", "table", "coffee-table", "dining-table", "flower-vase"]);
const TALL_ITEMS = new Set(["lamp", "plant", "bookshelf"]);
const VALID_FACINGS: Facing[] = ["front", "back", "left", "right"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeYaw(yaw: number): number {
  if (!Number.isFinite(yaw)) return 0;
  const twoPi = Math.PI * 2;
  const wrapped = ((yaw + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  return wrapped;
}

function inferFacingFromYaw(yaw: number): Facing {
  const abs = Math.abs(yaw);
  if (abs < 0.45) return "front";
  if (abs > 2.2) return "back";
  return yaw > 0 ? "left" : "right";
}

// Fixed floor-level pitch values per item type.
// Viewer convention (this app): pitch > 0 points DOWN to the floor, pitch < 0 points UP to the ceiling.
// We never trust the AI's pitch output — sign conventions are easy to get wrong.
//
// These values are intentionally subtle (close to the horizon) to keep overlays grounded
// without dropping too far down the sphere.
function floorPitchForItem(itemId: string): number {
  // Standard floor furniture
  if (FLOOR_ITEMS.has(itemId)) return 0.10;
  // Tall items (lamps, plants, bookshelves): keep slightly closer to horizon
  if (TALL_ITEMS.has(itemId)) return 0.05;
  return 0.10; // fallback
}

function normalizeRecommendations(recommendations: PlacementSuggestion[] | undefined): PlacementSuggestion[] {
  if (!recommendations?.length) return [];

  const totalPlacements = recommendations.reduce((sum, rec) => sum + (rec.placements?.length ?? 0), 0);
  let placementIndex = 0;
  const usedYaws: number[] = [];

  return recommendations.map((rec) => {
    const minSeparation = rec.id === "chair" ? 0.12 : 0.18;
    const normalizedPlacements = (rec.placements ?? []).map((placement) => {
      const baseYaw = normalizeYaw(
        Number.isFinite(placement.yaw)
          ? placement.yaw
          : -2.5 + ((placementIndex + 1) / (totalPlacements + 1)) * 5
      );

      let yaw = baseYaw;
      let guard = 0;
      while (
        usedYaws.some((existing) => Math.abs(normalizeYaw(existing - yaw)) < minSeparation) &&
        guard < 12
      ) {
        const direction = guard % 2 === 0 ? 1 : -1;
        const step = 0.12 + guard * 0.03;
        yaw = normalizeYaw(baseYaw + direction * step);
        guard += 1;
      }
      usedYaws.push(yaw);

      // Always use the hardcoded floor pitch — never trust AI pitch output
      // because sign conventions are easy to get wrong.
      const rawPitch = placement.pitch;
      const pitch = floorPitchForItem(rec.id);
      if (rawPitch !== pitch) {
        console.log(
          `[normalize] ${rec.id} pitch override: AI said ${rawPitch?.toFixed(3) ?? "null"} → server set ${pitch.toFixed(3)}`
        )
      }

      const facing: Facing = VALID_FACINGS.includes(placement.facing as Facing)
        ? (placement.facing as Facing)
        : inferFacingFromYaw(yaw);

      placementIndex += 1;
      return {
        ...placement,
        yaw,
        pitch,
        facing,
      };
    });

    return {
      ...rec,
      quantity: Math.max(1, Number.isFinite(rec.quantity) ? Math.floor(rec.quantity) : normalizedPlacements.length || 1),
      placements: normalizedPlacements,
    };
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  let imageBase64: string;
  let eventType: string;
  let sceneLabel: string;
  let dimensions: string;

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    eventType = body.eventType ?? "Event";
    sceneLabel = body.sceneLabel ?? "Main Hall";
    dimensions = body.dimensions ?? "unknown";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  // Ensure proper data URL format
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const userPrompt = `Analyse this 360° panorama of "${sceneLabel}" (${dimensions}) for a ${eventType} event.

Event type: ${eventType}
Scene: ${sceneLabel}
Room dimensions: ${dimensions}

Look carefully at the image. Identify walls, doors, windows, focal points, and floor space. Design a complete, realistic furniture layout that a professional event designer would be proud of. Focus on traffic flow, focal points, social dynamics, and visual balance when placing every item.`;

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!groqResponse.ok) {
    const err = await groqResponse.text();
    return NextResponse.json({ error: `Groq API error: ${err}` }, { status: groqResponse.status });
  }

  const data = await groqResponse.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";

  let parsed: VisualDesignResponse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }

  parsed.recommendations = normalizeRecommendations(parsed.recommendations);

  return NextResponse.json(parsed);
}

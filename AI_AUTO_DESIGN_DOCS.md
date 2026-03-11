# AI Auto-Design — Full Technical Documentation

## Table of Contents
1. [Feature Overview](#1-feature-overview)
2. [Architecture Map](#2-architecture-map)
3. [End-to-End Flow](#3-end-to-end-flow)
4. [Scene Capture](#4-scene-capture)
5. [API Route — `/api/ai-visual-design`](#5-api-route)
6. [AI Vision Model — How It Thinks](#6-ai-vision-model--how-it-thinks)
7. [Coordinate System](#7-coordinate-system)
8. [Server-Side Normalization](#8-server-side-normalization)
9. [Front-End Application](#9-front-end-application)
10. [Data Structures](#10-data-structures)
11. [Placement Pipeline Diagram](#11-placement-pipeline-diagram)
12. [Design Decisions & Bug Fixes](#12-design-decisions--bug-fixes)

---

## 1. Feature Overview

**AI Auto-Design** is a one-click furniture placement assistant embedded in the 360° event editor. It:

- Takes a snapshot of the current panoramic scene
- Sends it to a multimodal vision AI (Llama 4 Scout via Groq)
- Receives a structured furniture placement plan in JSON
- Normalizes the coordinates server-side
- Injects the furniture items directly into the live 3D panorama as draggable hotspots

The user sees a 4-step animated flow: **Capture → Analyse → Preview → Apply**.

---

## 2. Architecture Map

```
editor/page.tsx
│
├── captureScene()              ← grabs full equirectangular image via /api/proxy-image
│
├── <AIAutoDesign />            ← UI component (src/components/AIAutoDesign.tsx)
│     ├── Step: capturing       ← calls onCapture()
│     ├── Step: analysing       ← POST /api/ai-visual-design
│     ├── Step: preview         ← shows layout plan to user
│     └── Step: placing         ← calls onApply(PlacedItem[])
│
└── /api/ai-visual-design       ← Edge API route (src/app/api/ai-visual-design/route.ts)
      ├── Builds system prompt
      ├── Calls Groq API (Llama 4 Scout vision model)
      ├── Parses JSON response
      ├── normalizeRecommendations()
      └── Returns VisualDesignResponse

SceneOverlay.tsx                ← reprojects PlacedItem[] into screen-space overlays
PanoramaViewer.tsx              ← hosts the Marzipano 360° viewer
```

---

## 3. End-to-End Flow

### Step 1 — User clicks "Analyse & Auto-Design Scene"

```
AIAutoDesign.runAnalysis()
  → setStep("capturing")
  → imageBase64 = await onCapture()         // calls editor's captureScene()
  → setStep("analysing")
  → POST /api/ai-visual-design { imageBase64, eventType, sceneLabel, dimensions }
  → data = await response.json()
  → setResult(data)
  → setStep("preview")
```

### Step 2 — Preview panel shown

The user sees:
- **Scene Analysis** paragraph (what the AI saw)
- **Layout Style** tag (e.g. "Seated Gala Dinner")
- **Design Strategy** paragraph (why this layout)
- **Furniture Plan** — list of items with quantity and placement count
- **Total Estimated Cost** in €
- **Replace / Merge** toggle
- **Apply N Placements** button

### Step 3 — User clicks Apply

```
AIAutoDesign.handleApply()
  → convertSuggestionToPlacedItems(result.recommendations)
  → each PlacementSuggestion → PlacedItem[]
  → onApply(newItems)  →  setPlacedItems()  →  SceneOverlay re-renders
```

---

## 4. Scene Capture

**File:** `src/app/editor/page.tsx` — `captureScene()`

```ts
const captureScene = useCallback(async (): Promise<string | null> => {
  const sceneSrc = (EVENT_SCENES[eventType] ?? EVENT_SCENES["Wedding"])[sceneIndex]?.src;
  if (!sceneSrc) return null;

  // 1. Try server-side proxy — returns full equirectangular as data URL
  try {
    const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(sceneSrc)}`);
    if (proxyRes.ok) {
      const { dataUrl } = await proxyRes.json();
      if (dataUrl) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });
        const maxW = 1920;
        const w = Math.min(img.naturalWidth, maxW);
        const h = Math.round((w / img.naturalWidth) * img.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL("image/jpeg", 0.82);
      }
    }
  } catch (err) {
    console.warn("[captureScene] Proxy failed, falling back to viewport canvas", err);
  }

  // 2. Fallback: grab Marzipano's current viewport canvas (≈90° FOV)
  const container = panoramaRef.current?.getContainer();
  const canvas = container?.querySelector("canvas");
  return canvas ? canvas.toDataURL("image/jpeg", 0.85) : null;
}, [eventType, sceneIndex]);
```

**Why full equirectangular (via proxy)?**
The AI needs to see the entire room — walls, floor, ceiling, corners — not just the 90° viewport the user happens to be looking at. The `/api/proxy-image` route fetches the PolyHaven HDRI on the server (avoiding CORS), then the client downsamples it to ≤1920px width and encodes it as a base64 JPEG. This gives the AI a true 2:1 panorama while keeping payload size reasonable; if the proxy fails, the system gracefully degrades to a viewport-only snapshot.

---

## 5. API Route

**File:** `src/app/api/ai-visual-design/route.ts`
**Runtime:** Edge (Vercel Edge Functions — no Node.js APIs)

### Request body
```ts
{
  imageBase64: string;    // full data URL, e.g. "data:image/jpeg;base64,..."
  eventType: string;      // "Wedding" | "Conference" | "Gala Dinner"
  sceneLabel: string;     // e.g. "Dancing Hall"
  dimensions: string;     // e.g. "25m x 40m"
}
```

### Response body (`VisualDesignResponse`)
```ts
{
  sceneAnalysis: string;          // 2-3 sentence description of the room
  layoutStyle: string;            // e.g. "Cocktail Reception"
  designReasoning: string;        // why this layout strategy
  totalEstimatedCost: number;     // sum of all unit prices × quantities
  recommendations: PlacementSuggestion[];
}
```

### Groq API call
```ts
fetch("https://api.groq.com/openai/v1/chat/completions", {
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: [
        { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        { type: "text",      text: userPrompt }
    ]}
  ],
  temperature: 0.4,          // low = more consistent, less random
  max_tokens: 2000,
  response_format: { type: "json_object" }  // forces valid JSON output
})
```

### Furniture Catalogue (what the AI can choose from)
| id | label | Width | Height | Price |
|----|-------|-------|--------|-------|
| chair | Chair | 90px | 110px | €75 |
| sofa | Sofa | 160px | 100px | €450 |
| table | Table | 140px | 100px | €220 |
| lamp | Floor Lamp | 60px | 160px | €120 |
| plant | Plant | 80px | 130px | €45 |
| coffee-table | Coffee Table | 130px | 80px | €180 |
| bookshelf | Bookshelf | 110px | 160px | €250 |
| flower-vase | Flower Vase | 70px | 130px | €35 |
| dining-table | Dining Table | 160px | 110px | €550 |

---

## 6. AI Vision Model — How It Thinks

### Model
**Llama 4 Scout 17B** (16 expert mixture-of-experts) via Groq inference.
- Multimodal: accepts image + text
- 17B active parameters, very fast on Groq hardware
- Strong spatial reasoning from image content

### System Prompt (key instructions)
```
You are an expert event scenography AI. You analyse 360° equirectangular
panorama images of empty venues and produce precise furniture placement plans.

COORDINATE SYSTEM:
- yaw: horizontal angle in RADIANS. Range: -π to +π.
  0 = centre of image (forward). Positive = left, negative = right.
- pitch: set pitch to -0.62 for all floor items and -0.40 for tall items.
  Do NOT use positive pitch values — positive pitch points at the ceiling.
- Distribute: vary yaw across the full scene (-2.8 to +2.8 radians).

PLACEMENT RULES:
1. Spread items across the full yaw range to fill the space
2. Use 6-16 total placements depending on scene size
3. Group related items (chairs around tables)
4. Place tall items (lamps, plants) along walls (wider yaw spread)
5. Keep aisles clear (avoid clustering at yaw=0)
6. For dining: tables first, then chairs at ±0.15 yaw offset around each table
7. For cocktail: mix tall tables, chairs, sofas, plants asymmetrically
```

### What the AI actually does with the image

1. **Reads the panorama** — identifies floor area, wall lines, architectural features (pillars, windows, stage, etc.)
2. **Estimates room size** from perspective and known proportions
3. **Chooses layout style** based on `eventType` and room shape
4. **Selects furniture types** appropriate for the event
5. **Assigns yaw angles** — spreads items across the horizontal field, grouping related pieces (e.g. chairs ±0.15 rad around a table center)
6. **Assigns pitch** — instructed to use fixed values (-0.62 / -0.40), but we still override these server-side for robustness
7. **Writes reasoning** per placement ("facing the entrance at yaw -1.2")

### Temperature = 0.4
Low temperature means the AI is mostly deterministic. It will give similar results for the same scene, with slight variation. Higher temperature would make placements more creative but also more random/wrong.

---

## 7. Coordinate System

The placement coordinates map into **Marzipano's RectilinearView** system:

```
         pitch = +π/2 (ceiling)
                   │
                   │
yaw = -π ──────── 0 ──────── yaw = +π
(back-right)    (forward)    (back-left)
                   │
                   │
         pitch = -π/2 (floor)
```

### Key values for furniture placement
| Position | yaw | pitch |
|----------|-----|-------|
| Directly ahead, floor level | 0 | -0.62 |
| Left side of room, floor | +1.5 | -0.62 |
| Right side of room, floor | -1.5 | -0.62 |
| Behind viewer, floor | ±3.0 | -0.62 |
| Floor lamp / tall item | any | -0.40 |
| Eye level (horizon) | any | 0 |
| Ceiling | any | +0.42 |

### Why pitch is hardcoded (not from AI)

The Llama model was consistently returning **positive pitch values** for floor items, which placed furniture near the ceiling. This is because:
- The model's training data uses different pitch conventions
- Positive pitch "up" is intuitive to a non-technical model
- The sign is easy to get wrong without concrete grounding

**Fix:** The server completely ignores the AI's pitch output and assigns hardcoded values tuned for large-venue panoramas:
```ts
function floorPitchForItem(itemId: string): number {
  // Tall items (lamps, plants, bookshelves): base on floor, visual centre is mid-height
  if (TALL_ITEMS.has(itemId)) return -0.40;
  // Standard floor furniture: chairs, sofas, tables, dining tables, coffee tables, vases
  if (FLOOR_ITEMS.has(itemId)) return -0.62;
  return -0.52;  // fallback for anything not categorised
}
```

---

## 8. Server-Side Normalization

**Function:** `normalizeRecommendations()` in the API route.

After getting the raw AI response, every placement goes through normalization before being sent to the client:

### Step 1 — Yaw wrapping
```ts
function normalizeYaw(yaw: number): number {
  if (!Number.isFinite(yaw)) return 0;
  // Wrap into [-π, +π]
  const twoPi = Math.PI * 2;
  return ((yaw + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}
```
Handles cases where AI returns yaw = 7.5 (outside valid range).

### Step 2 — Fallback yaw for missing values
If the AI returns `null`, `undefined`, or `NaN` for yaw, items are distributed evenly:
```ts
const baseYaw = normalizeYaw(
  Number.isFinite(placement.yaw)
    ? placement.yaw
    : -2.5 + ((placementIndex + 1) / (totalPlacements + 1)) * 5
);
//  ↑ evenly spaces items across [-2.5, +2.5] range
```

### Step 3 — Minimum yaw separation (anti-clustering)
Items of the same type cannot be placed too close together:
```ts
const minSeparation = rec.id === "chair" ? 0.12 : 0.18;
// Chairs can be closer (grouped around tables)
// Other items need at least 0.18 rad (~10°) separation

while (
  usedYaws.some(existing => Math.abs(normalizeYaw(existing - yaw)) < minSeparation) &&
  guard < 12
) {
  const direction = guard % 2 === 0 ? 1 : -1;
  const step = 0.12 + guard * 0.03;
  yaw = normalizeYaw(baseYaw + direction * step);  // nudge outward & wrap
  guard++;
}
```

### Step 4 — Pitch override (and diagnostics)
```ts
const rawPitch = placement.pitch;
const pitch = floorPitchForItem(rec.id);  // always floor, ignores AI pitch
if (rawPitch !== pitch) {
  console.log(
    `[normalize] ${rec.id} pitch override: AI said ${rawPitch?.toFixed(3) ?? "null"} → server set ${pitch.toFixed(3)}`
  );
}
```

### Step 5 — Facing inference
```ts
const facing: Facing = VALID_FACINGS.includes(placement.facing as Facing)
  ? (placement.facing as Facing)
  : inferFacingFromYaw(yaw);
  //  yaw near 0   → "front"
  //  |yaw| > 2.2  → "back"
  //  yaw > 0      → "left"
  //  yaw < 0      → "right"
```

### Step 6 — Quantity sanitization
```ts
quantity: Math.max(
  1,
  Number.isFinite(rec.quantity) ? Math.floor(rec.quantity) : normalizedPlacements.length || 1
)
// Prevents 0, negative, float, or undefined quantities
```

---

## 9. Front-End Application

### `convertSuggestionToPlacedItems()`

**File:** `src/components/AIAutoDesign.tsx`

Transforms the API response into `PlacedItem[]` objects that `SceneOverlay` can render:

```ts
function convertSuggestionToPlacedItems(suggestions: PlacementSuggestion[]): PlacedItem[] {
  for (const suggestion of suggestions) {
    const furnitureItem = FURNITURE_ITEMS.find(f => f.id === suggestion.id);
    // matches against the local furniture catalogue (with PNG image paths)

    for (const placement of suggestion.placements) {
      result.push({
        uid: `ai-${++uidSeed}`,          // unique ID for React keys + drag handles
        item: furnitureItem,             // full FurnitureItem with image views
        yaw: placement.yaw,              // from normalized API response
        pitch: placement.pitch,          // hardcoded floor value from server
        width: furnitureItem.defaultWidth,
        height: furnitureItem.defaultHeight,
        facing: placement.facing,        // "front" | "back" | "left" | "right"
        flipX: false,
        locked: false,
      });
    }
  }
}
```

### How furniture is rendered in the scene

`SceneOverlay.tsx` now uses a **React overlay layer** instead of Marzipano hotspots:

```ts
// Every animation frame, reproject world-space anchors into screen-space
const screen = view.coordinatesToScreen({ yaw: item.yaw, pitch: item.pitch });
// Store per-uid ScreenPos { x, y, visible, rotateY, rotateX, scale }
```

Marzipano still drives the underlying 360° camera, but `SceneOverlay`:
- Calls `coordinatesToScreen` every frame to get each item's 2D position
- Applies `perspective(600px) rotateY(...) rotateX(...) scale(...)` so furniture follows the sphere curvature
- Renders each `PlacedItem` as an absolutely positioned `<Image>` with drag, resize, facing rotation, flip, and lock controls.

### Replace vs Merge

When the user clicks "Apply":
- **Replace** → `onApply(newItems)` — clears all existing furniture, places AI items only
- **Merge** → `onApply([...currentItems, ...newItems])` — keeps manually placed items, adds AI items on top

---

## 10. Data Structures

### `PlacedItem` (SceneOverlay.tsx)
```ts
interface PlacedItem {
  uid: string;           // unique identifier, e.g. "ai-9001"
  item: FurnitureItem;   // catalogue item (label, image views, price, dimensions)
  yaw: number;           // horizontal position in radians [-π, +π]
  pitch: number;         // vertical position in radians, always negative (floor)
  width: number;         // display width in pixels
  height: number;        // display height in pixels
  facing: Facing;        // which image view to use: front/back/left/right
  flipX?: boolean;       // mirror the image horizontally
  locked?: boolean;      // prevent drag/resize
  brandedSrc?: string;   // canvas-composited data URL with logo (optional)
}
```

### `PlacementSuggestion` (API route)
```ts
interface PlacementSuggestion {
  id: string;            // furniture catalogue id
  label: string;         // human-readable name
  quantity: number;      // how many of this item
  placements: {
    yaw: number;         // AI-suggested (may be overridden)
    pitch: number;       // AI-suggested (always overridden server-side)
    facing: Facing;      // AI-suggested
    reasoning: string;   // "Placed near the entrance for easy access"
  }[];
}
```

### `VisualDesignResponse` (API route)
```ts
interface VisualDesignResponse {
  sceneAnalysis: string;          // room description paragraph
  recommendations: PlacementSuggestion[];
  totalEstimatedCost: number;     // € sum
  designReasoning: string;        // overall strategy explanation
  layoutStyle: string;            // "Cocktail Reception", "Seated Dinner", etc.
}
```

---

## 11. Placement Pipeline Diagram

```
User clicks "Analyse & Auto-Design"
           │
           ▼
   captureScene()
   ┌─────────────────────────────────────┐
   │  Load full equirectangular JPG      │
   │  Draw to offscreen canvas (≤1920px) │
   │  Export as base64 JPEG              │
   └───────────────────┬─────────────────┘
                       │ imageBase64
                       ▼
         POST /api/ai-visual-design
   ┌─────────────────────────────────────┐
   │  Build system prompt                │
   │  Send image + prompt → Groq API     │
   │  Model: llama-4-scout-17b           │
   │  temperature: 0.4                   │
   │  response_format: json_object       │
   └───────────────────┬─────────────────┘
                       │ raw JSON string
                       ▼
         normalizeRecommendations()
   ┌─────────────────────────────────────┐
   │  For each placement:                │
   │  1. Wrap yaw to [-π, +π]            │
   │  2. Fallback yaw if NaN             │
   │  3. Nudge yaw to avoid clustering   │
   │  4. Override pitch → floor value    │
   │  5. Infer facing from yaw           │
   │  6. Sanitize quantity               │
   └───────────────────┬─────────────────┘
                       │ VisualDesignResponse
                       ▼
         AIAutoDesign: Preview step
   ┌─────────────────────────────────────┐
   │  Show scene analysis text           │
   │  Show furniture list + cost         │
   │  User confirms or re-analyses       │
   └───────────────────┬─────────────────┘
                       │ user clicks Apply
                       ▼
   convertSuggestionToPlacedItems()
   ┌─────────────────────────────────────┐
   │  Match suggestion.id → FurnitureItem│
   │  Create PlacedItem with uid, yaw,   │
   │  pitch, width, height, facing       │
   └───────────────────┬─────────────────┘
                       │ PlacedItem[]
                       ▼
          setPlacedItems(newItems)
  ┌─────────────────────────────────────┐
  │  SceneOverlay.tsx re-renders        │
  │  Reprojects world coords each frame │
  │  Furniture appears in 3D scene      │
  │  Items are draggable, rotatable,    │
  │  flippable & resizable              │
  └─────────────────────────────────────┘
```

---

## 12. Design Decisions & Bug Fixes

### Bug 1 — Furniture appearing near ceiling (fixed)
**Cause:** Llama 4 Scout returns positive pitch values for floor items. Positive pitch = looking up = ceiling.
**Fix:** Server ignores AI pitch entirely. Hardcoded floor values (-0.62 / -0.40) are assigned per item category via `floorPitchForItem`.

### Bug 2 — Furniture appearing in random/clustered positions (fixed)
**Cause:** AI was only seeing the current viewport (90° slice), not the full scene. It would cluster all items around yaw=0 (forward).
**Fix:** `captureScene()` now calls the `/api/proxy-image` route to fetch the full equirectangular HDRI on the server, then downsamples and encodes it on the client. As a fallback, it still uses the Marzipano viewport canvas if the proxy fails.

### Bug 3 — Items overlapping (fixed)
**Cause:** AI often places multiple chairs at nearly identical yaw values when describing a table setup.
**Fix:** `normalizeRecommendations()` enforces minimum yaw separation (0.12 rad for chairs, 0.18 rad for others) and nudges colliding items outward.

### Bug 4 — Invalid yaw values crash the viewer (fixed)
**Cause:** AI occasionally returns `null`, `NaN`, or out-of-range values like 8.5 rad.
**Fix:** `normalizeYaw()` wraps all values to [-π, +π]. Invalid values fall back to evenly-distributed positions.

### Design choice — Edge runtime
The API route uses `export const runtime = "edge"` for lowest latency. The Groq API call is a single fetch with no Node.js-specific APIs, making it fully compatible with the edge runtime.

### Design choice — temperature 0.4
A lower temperature (0.0–0.4) was chosen over 0.7–1.0 because furniture placement is a precision task. We want consistent, reasonable layouts — not creative but spatially wrong outputs.

### Design choice — `response_format: { type: "json_object" }`
Forces the model to output valid JSON, eliminating the need to parse markdown code blocks or handle malformed responses.

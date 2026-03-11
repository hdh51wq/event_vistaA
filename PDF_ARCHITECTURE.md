# EventVista PDF Generation Architecture

This document provides a detailed technical breakdown of the PDF export system within EventVista, explaining the data flow, the architectural structure of the generator, and the specific logic used to produce professional event proposals.

---

## 1. Overview & Technology Stack

The PDF export system is designed to transform a dynamic 360° design project into a structured, high-fidelity document suitable for B2B client presentations.

- **Primary Library**: `jsPDF` (v2.5.1+) - Used for low-level PDF document creation and coordinate-based drawing.
- **Table Plugin**: `jspdf-autotable` - Used to handle complex dynamic tables (Furniture lists, Technical specs, Budgets).
- **Core Engine**: Located in `src/lib/exportPdf.ts`.

---

## 2. Data Flow: From Editor to PDF

The export process follows a specific lifecycle from the user's click to the final file download.

### Step 1: Data Preparation (`EditorPage`)
When the user clicks **"Export PDF"** in the Editor UI, the `handleExportPdf` function is triggered. It performs the following operations:
1. **Scene Mapping**: It iterates through all available scenes for the selected event type.
2. **Item Enrichment**: For every scene, it retrieves the `placedItems` from the global state.
3. **Price Reconciliation**: 
   - It checks if an item has a price saved in the project data.
   - If the price is missing (common in older projects) or is `$0`, it performs a lookup in the central `FURNITURE_ITEMS` library (`src/lib/furniture.ts`) to fetch the default professional estimation.
   - This ensures the PDF never displays empty or incorrect financial data.

### Step 2: The Generator Execution
The enriched data is passed to `exportProjectToPdf()`. This function is asynchronous as it handles potential image embedding and complex layout calculations.

---

## 3. PDF Structure (The 8 Sections)

The resulting PDF is organized into 8 distinct sections to provide a comprehensive professional overview.

### Section 1: Cover Page
- **Visuals**: Dark-themed full-page background.
- **Data**: Project Name, Client Name, Agency Name, and the current Date.
- **Branding**: Displays the EventVista logo and professional subtitle.

### Section 2: Project Overview
- **Purpose**: Sets the context for the event.
- **Data**: Dynamic text based on the `eventType`.
- **Key Details**: Summary of scene count and project status.

### Section 3: Scenes Presentation
- **Purpose**: Showcases the creative vision.
- **Data**: Lists every scene (e.g., "Grand Ballroom", "Rooftop Lounge") with its unique label.
- **Technical Hints**: Includes the daily rental price and count of assets for each specific environment.

### Section 4: Technical Specs
- **Data Source**: Extracted from the `EVENT_SCENES` metadata.
- **Table Columns**: Venue Name, Dimensions (Spatial data), Setup Timeline (Time estimation), and Rent/Day.

### Section 5: Furniture & Elements
- **Aggregation Logic**: The system iterates through *all* items across *all* scenes and groups them by their `ID`.
- **Calculations**: Calculates `Quantity * Unit Price` to produce line-item subtotals.
- **Table**: Uses `jspdf-autotable` with a coral-themed header.

### Section 6: Budget Summary
- **Financial Logic**:
    - **Subtotal**: Sum of all furniture and scenography.
    - **Venue Rent**: Sum of rental prices for all scenes used.
    - **Logistics (15%)**: Automatic estimation for transport and setup.
    - **Agency Fee**: Fixed management fee ($2,500).
- **Total**: High-contrast coral box displaying the "Total Estimated Investment".

### Section 7: Budget Evolution (Initial vs Final)
- **Purpose**: Demonstrates the refinement of the project.
- **Comparison**: Contrasts an "Initial Estimation" (calculated as a baseline) against the "Final Design Proposal" based on the current 360° layout.

### Section 8: Terms & Conditions & Next Steps
- **Actionable Data**: Numbered list of steps for the client to proceed (Approve, Sign, Deposit).
- **Legal**: Standard disclaimer text regarding price validity and property rights.

---

## 4. Code Breakdown (`src/lib/exportPdf.ts`)

### Functional Design
The file is structured as a series of procedural drawing calls.

```typescript
// Header Utility
const addHeader = () => {
  doc.setFontSize(10);
  doc.text("EVENTVISTA DESIGN PROPOSAL", 14, 10);
  doc.line(14, 12, 196, 12); // Underline divider
};
```

### Furniture Aggregation Logic
This is the most complex part of the data processing. It ensures that if a user places 10 "Chairs" across 3 different rooms, they appear as a single line item with a count of 10 in the final quote.

```typescript
const furnitureSummary: Record<string, { label: string; count: number; price: number }> = {};

allFurniture.forEach(p => {
  const key = p.item.id;
  if (!furnitureSummary[key]) {
    // Fallback pricing if p.item.price is missing
    let price = p.item.price || FURNITURE_ITEMS.find(fi => fi.id === p.item.id)?.price || 0;
    furnitureSummary[key] = { label: p.item.label, count: 0, price };
  }
  furnitureSummary[key].count++;
});
```

### Color Palette
To maintain the "Soft Minimalism" requested in the design guidelines, the PDF uses a strictly defined color array:
- **Coral**: `[255, 107, 74]` (#FF6B4A) - Used for accents, totals, and headers.
- **Dark**: `[15, 15, 15]` - Used for the cover and main titles.
- **Grey**: `[150, 150, 150]` - Used for secondary technical text.

---

## 5. Metadata Integration (`src/lib/furniture.ts`)

The PDF system relies on the central furniture library for data integrity. Each `FurnitureItem` interface includes:
- `label`: Friendly name for the table.
- `price`: Professional estimation used as the source of truth for the budget if a custom price isn't provided.

This separation of concerns allows the PDF generator to stay "dumb" while the business logic and pricing remain centralized in the furniture library.

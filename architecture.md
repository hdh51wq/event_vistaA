# EventVista Architecture & Interactive Systems

This document details the advanced interactive features, data flows, and export engines implemented in EventVista, following the professional pseudo-3D furniture rotation and multi-scene persistence update.

---

## 1. Advanced Interactive Editor (`/editor`)

For a detailed breakdown of where each data type is stored (Database vs. Code) and the reasoning behind it, see [DATA_STRATEGY.md](./DATA_STRATEGY.md).

The editor integrates a custom 3D projection overlay with the Marzipano engine.

### **Furniture Interaction System**
- **Overlay Layer**: `SceneOverlay.tsx` acts as the primary interaction layer, mapped to the spherical coordinates of the 360° view.
- **Multi-View Rotation**: Items are not just 2D-rotated; they swap their image source based on a `facing` property (`front`, `back`, `left`, `right`).
- **Precision Transforms**: Items support `flipX` (horizontal mirror), `scale`, and discrete 90°/180° rotation steps via a selection-aware toolbar.
- **State Management**: Uses a centralized `placedItems` state array, which is saved as a JSON object in the project's `data` field.

### **Data Persistence**
- **Draft Save**: The "Save Draft" button triggers a `PATCH /api/projects/:id` call, updating the `data` field with the current placement state.
- **Auto-Restoration**: Upon loading the editor, the system checks for `project.data` and re-hydrates the interactive furniture items, matching them to their corresponding catalog assets.

---

## 2. Export, Sharing & Analytics Engines

### **Analytics System (`/analytics`)**
A high-performance insight engine for agency data.
- **Dynamic Calculation**: Analytics are generated in real-time from the `Project` database using optimized in-memory processing. For a deep dive into the calculation logic, see [ANALYTICS_ARCHITECTURE.md](./ANALYTICS_ARCHITECTURE.md).
- **Data Points**: Aggregates Budget, Event Type, Client, and Project Status to provide Revenue Charts, Seasonal Trends, and Client Insights.
- **Deletability**: The system is fully reactive; deleting a project immediately updates all historical and current-period analytics.

### **Digital Interactive Proposal (`/share/[id]`)**
A specialized shareable web view that functions as the **ultimate professional proposal**.
- **Interactive Scenes**: Clients can rotate the 360° environment with their mouse to explore the scenography from all angles.
- **Report Mode**: A high-end "Digital Report" overlay (`VIEW FULL PROPOSAL`) that mirrors the PDF structure but remains interactive.
- **Dynamic Data**: Includes Overview, Technical Specs (auto-calculated), Furniture Inventory, and a real-time Budget Summary based on the design.
- **Interactive Hints**: Includes an animated instruction ("Click and drag...") that guides new users through the 360° experience.

### **Standalone Viewer Export**
Generates a fully self-contained HTML file for offline/local viewing.
- **Base64 Encoding**: Uses a `toBase64` utility to embed high-res 360° scenes and furniture SVGs directly into the HTML to eliminate external asset dependencies.
- **Standalone Template**: Embeds a specialized version of the Marzipano engine (`SingleAssetSource`) to ensure immediate rendering of large Base64-encoded textures.
- **Local Persistence**: All furniture placements (yaw, pitch, scale, facing) are injected as a JSON constant within the exported file's `<script>` tag.

### **PDF Proposal Export**
Generates a professional, branded design proposal in PDF format.
- **Interactive Integration**: The PDF now includes clickable buttons and links that direct the client to the **Interactive Digital Proposal** for mouse-controlled 360° exploration.
- **Detailed Flow**: See [PDF_ARCHITECTURE.md](./PDF_ARCHITECTURE.md) for a technical breakdown of the 8-section generator.
- **Structured Report**: Includes Cover Page, Project Overview, Scenes Presentation, **Technical Specs**, **Furniture Inventory**, **Budget Summary**, **Budget Evolution**, and Terms & Conditions.
- **Intelligent Pricing**: 
    - **Custom Pricing**: Priority is given to user-defined prices for uploaded assets.
    - **Fallback System**: Automatically fetches professional price estimations from the centralized library (`src/lib/furniture.ts`) if project data is missing or set to $0.
- **Technical Integration**: Auto-extracts Venue Dimensions, Setup Timeline, and Daily Rent prices based on the 360° venue selected.

---

## 4. Centralized Data & Asset Library

### **Furniture Library (`src/lib/furniture.ts`)**
A centralized source of truth for all furniture metadata and standard assets.
- **Metadata Management**: Stores `id`, `label`, `price`, and `imagePaths` (front, back, left, right) for all standard library items.
- **Pricing Source**: Serves as the fallback for budget calculations in the PDF engine and UI displays.

### **Custom Asset Pipeline (`FurnitureUploadModal.tsx`)**
- **Multi-View Upload**: Supports simultaneous uploading of Front, Back, Left, and Right views for a single item.
- **Validation Engine**:
  - **Format**: Restricts uploads to PNG, JPG, and SVG.
  - **Integrity**: Checks for file corruption and valid image headers.
  - **Optimization**: Enforces a 5MB limit per image to maintain performance in 360° space.
  - **Metadata**: Collects item name and custom price during the upload process.
- **Backend (`/api/furniture/upload`)**:
  - **Secure Storage**: Files are saved to a user-specific, isolated directory (`/public/uploads/furniture/[user-id]/`).
  - **Database Sync**: Automatically updates the `User` model's `customFurniture` array with the new asset paths and metadata.

---

## 5. Directory Layout (Updates)

```
src/
├── app/
│   ├── share/[id]/            # Interactive Digital Proposal (Read-only)
│   ├── api/
│   │   ├── share/[id]/        # Public-facing data endpoint
│   │   ├── projects/[id]/     # Enhanced to support "data" persistence
│   │   └── furniture/
│   │       └── upload/        # Custom asset upload & validation API
│   └── editor/
│       └── page.tsx           # Interactive editor logic
├── components/
│   ├── SceneOverlay.tsx       # Furniture placement & interaction engine
│   ├── FurniturePanel.tsx     # Library of standard & custom assets with pricing
│   ├── FurnitureUploadModal.tsx # Multi-view asset upload UI & validation
│   └── PanoramaViewer.tsx     # Core Marzipano 360° integration
├── lib/
│   ├── furniture.ts           # CENTRALIZED: Furniture metadata & prices
│   ├── exportPdf.ts           # PDF generation engine (8 sections)
│   └── utils.ts               # Shared helpers (formatting, etc.)
├── models/
│   ├── User.ts                # Updated with customFurniture & pricing schema
│   └── Project.ts             # Stores "data" blob for placements
└── public/
    ├── furniture/             # Standard directional SVGs
    └── uploads/
        └── furniture/         # User-uploaded custom asset storage
```

---

## 6. Environment & Deployment
- **Database**: 
  - `projects` collection includes a `data` field for placements.
  - `users` collection includes `customFurniture` array for personal assets.
- **Styling**: Tailwind CSS 4 with custom `glass-card` and `shadow-soft` utilities.
- **Animations**: Framer Motion handles all feedback loops (saving animations, upload progress, tooltip fades, loading spinners).

---
*Last updated: 2026-03-01*

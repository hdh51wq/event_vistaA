# EventVista - Premium Event Scénography Platform

EventVista is a high-fidelity B2B SaaS platform for event agencies to design, present, and export immersive 360° event proposals.

## Key Features

- **360° Interactive Editor**: Place and rotate 3D assets in photorealistic environments.
- **Directional Asset System**: Assets respond to rotation by swapping viewpoints (Front, Back, Left, Right).
- **Standalone Export**: Generate self-contained HTML viewers for offline presentations.
- **Professional PDF Proposal**: Export data-rich PDFs with technical specs, furniture inventory, and budget comparisons.
- **Client Presentation View**: Share live, interactive links with clients for design sign-offs.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```

2.  **Configure environment**:
    Create a `.env.local` file and add your `MONGODB_URI` and `JWT_SECRET`.

3.  **Run development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to access the platform.

## Documentation

For detailed technical breakdowns, please refer to:
- [Main Architecture](./architecture.md): Overview of interactive systems and data flow.
- [PDF Generation Engine](./PDF_ARCHITECTURE.md): Deep dive into the proposal export logic.

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS 4, Framer Motion
- **Backend**: Next.js API Routes, MongoDB (Mongoose)
- **Engine**: Marzipano (360° Viewer), jsPDF (Export)

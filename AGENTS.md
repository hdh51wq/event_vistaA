## Project Summary
EventVista is a premium B2B SaaS platform designed for event agencies to create and present immersive 360° event scénographies. It allows users to upload venue scenes, place 3D assets, and share high-fidelity design presentations with clients.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Typography**: Plus Jakarta Sans

## Architecture
- `src/app`: Application routes (Home, Dashboard, Editor)
- `src/components`: Shared UI components (Navbar)
- `src/lib`: Utility functions and hooks
- `src/visual-edits`: Integration for Orchids visual editing

## User Preferences
- **Theme**: Light-first professional UI (Soft Minimalism)
- **Palette**: White base with soft coral and peach accents
- **Corners**: 16px (rounded-2xl)
- **Typography**: Clear hierarchy, Plus Jakarta Sans primary

## Project Guidelines
- Use glassmorphism for navigation and high-level overlays
- Maintain airy spacing and soft shadows (shadow-soft/shadow-glass)
- Prefer functional components with "use client" for interactive elements
- No harsh borders or sharp edges

## Common Patterns
- Glass cards: `glass-card` class in CSS for consistent backdrop blur and translucent white
- Primary buttons: `btn-primary` with coral background and rounded-full shape
- Animation: Staggered entrance animations for page content using Framer Motion

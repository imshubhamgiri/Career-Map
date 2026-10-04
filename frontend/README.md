# Career OS — Frontend

Modern, feature-driven frontend for Career OS built with **Next.js (App Router)** and **Tailwind CSS v4**.

## Architecture Overview

```
frontend/src/
├── app/                  # Next.js App Router root layout, global styles & page shells
│   ├── globals.css       # Tailwind v4 (@import "tailwindcss"; @theme design tokens)
│   ├── layout.tsx        # Root HTML layout & font declarations
│   └── page.tsx          # Minimal entry point
├── core/                 # Shared / cross-cutting application foundation
│   ├── components/       # Design system primitives (ui/) & shared layouts (layout/)
│   ├── config/           # Environment variables & application constants
│   ├── hooks/            # Global custom hooks (e.g. useTheme, useDebounce)
│   ├── lib/              # Utility helpers (e.g. cn) & API client wrapper
│   ├── providers/        # Context providers (Theme, QueryClient, Toast)
│   └── types/            # Global types & common API response contracts
└── features/             # Domain modules dynamically mirroring backend services
    ├── auth/             # Authentication, sessions, user credentials
    ├── ingest/           # Roadmap ingestion (PDF, Drive URL, Web scraping)
    ├── roadmaps/         # Roadmap trees, nodes, topic categorizations
    ├── submissions/      # LeetCode submissions, code hashing, GitHub sync
    ├── problems/         # DSA problems, difficulty metadata, progress tracking
    └── settings/         # GitHub configs, API keys, user profile
```

### Feature Module Encapsulation Contract

Each feature module contains:
- `components/`: Feature-scoped UI components.
- `hooks/`: Feature-scoped business hooks and query mutations.
- `services/`: Feature-scoped API client methods.
- `types/`: Domain-specific TypeScript interfaces matching backend DTOs.
- `index.ts`: Public barrel export defining the feature's external interface.

## Documentation

For full file-level logic specifications, backend endpoint and controller mappings, and browser route mappings, see:
- [Frontend Architecture & Domain Specification](file:///e:/DevProjects/COS/docs/architecture/frontend.md)

## Tech Stack & Design System

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`, CSS-first `@theme` configuration)
- **Design Tokens**:
  - **Dark Mode**: Neutral backdrop (`#09090b`), surface (`#18181b`), border (`#27272a`)
  - **Light Mode**: Clean zinc backgrounds, slate borders
  - **Brand Accent**: `indigo (#6366f1) → violet (#8b5cf6) → cyan (#06b6d4)`
- **Icons**: Lucide React
- **Class Utilities**: `clsx`, `tailwind-merge`

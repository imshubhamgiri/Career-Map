# Frontend Architecture

## Design Philosophy

Career OS frontend delivers a fast, focused developer experience inspired by **Linear**, **Vercel**, and **Raycast**.

The UI avoids cluttered enterprise dashboard layouts, excessive borders, and heavy drop-shadows. Instead, it emphasizes clean typography, high information density, subtle borders, and keyboard ergonomics.

## Theming & Color Tokens

### 1. Dual Mode (Light & Dark)
The interface is designed from the ground up to support both Light and Dark themes:
- **Dark Theme**: Deep neutral backdrops (`#09090b` / `#18181b`), subtle contrasting borders (`#27272a`), crisp white text.
- **Light Theme**: Clean off-white and zinc backgrounds, slate borders, deep charcoal text.

### 2. Brand Accent
Gradients are strictly reserved for brand highlights, active selection indicators, and call-to-action badges:
```
indigo (#6366f1) → violet (#8b5cf6) → cyan (#06b6d4)
```

## Component Architecture

```
frontend/src/
├── app/                  # Application routing & page shells
├── components/
│   ├── ui/               # Reusable primitive components (Button, Input, Modal, Badge)
│   ├── layout/           # Header, Sidebar, CommandPalette, Footer
│   └── features/         # Domain components
│       ├── roadmaps/     # RoadmapTree, RoadmapCard, IngestModal
│       ├── tracker/      # ProblemTable, StatusSelector, RevisionQueue
│       └── analytics/    # ProgressBars, StreakCalendar
├── hooks/                # Custom React hooks (useRoadmaps, useTheme, useDebounce)
├── services/             # API client methods with typed responses
└── store/                # Global state management
```

## View States Contract

Every interactive screen and feature component must handle 5 essential states:

| State | Implementation Pattern |
|---|---|
| **Loading** | Skeleton placeholders matching layout geometry |
| **Empty** | Helpful illustration/icon, clear text, direct CTA |
| **Error** | Human-readable explanation, retry action button |
| **Success** | Immediate optimistic update or gentle toast notification |
| **Active/Interactive** | Keyboard shortcuts, clear focus rings, responsive adaptations |


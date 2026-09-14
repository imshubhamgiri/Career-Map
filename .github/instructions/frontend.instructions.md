# Frontend Development Instructions

## Design System & Aesthetics

Career OS follows a premium, minimal, sophisticated SaaS aesthetic inspired by **Linear**, **Vercel**, and **Raycast**.

### 1. Visual Language
- **Themes**: Support both **Light** and **Dark** modes seamlessly.
- **Brand Accents**: Use gradients strictly as subtle accents (`indigo` → `violet` → `cyan`).
- **Typography & Spacing**: Clean sans-serif typography, compact high-density layout, spacious margins where focus is needed.
- **Anti-Patterns**:
  - Avoid generic admin dashboard templates.
  - Avoid excessive cards, nested cards, and heavy borders.
  - Avoid neon/cyberpunk styling or overwhelming glassmorphism.
  - Avoid huge dropshadows.

### 2. Component Structure
Organize frontend code with clean boundaries:
- `app/` or `pages/`: Route definitions and layout wrappers.
- `components/ui/`: Atomic, reusable design system primitives (buttons, dialogs, inputs, tooltips).
- `components/features/`: Domain-specific components (e.g., `RoadmapTree`, `ProblemList`, `IngestionModal`).
- `hooks/`: Reusable React hooks.
- `services/` or `api/`: Strongly typed API client methods.
- `store/` or `state/`: Global state management.

### 3. State Completeness
Every UI view and interactive feature must explicitly account for:
- Loading state (skeleton loaders or subtle spinners)
- Empty state (clean typography with clear call-to-action)
- Error state (actionable messaging with retry)
- Success state
- Responsive layout (mobile to wide desktop)
- Keyboard accessibility & navigation


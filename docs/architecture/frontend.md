# Frontend Architecture & Domain Specification

This document serves as the comprehensive source of truth for the Career OS frontend application located at [`/frontend`](file:///e:/DevProjects/COS/frontend). It defines the directory structure, file-level logic responsibilities, backend system mappings, and browser route hierarchy.

---

## 1. Design Philosophy & Theming

Career OS delivers a fast, keyboard-first developer experience inspired by **Linear**, **Vercel**, and **Raycast**.

### Dual-Mode Theme Tokens
- **Dark Mode (Default)**: Deep neutral backdrops (`#09090b` / `#18181b`), subtle contrasting borders (`#27272a`), crisp zinc text (`#f4f4f5`).
- **Light Mode**: Zinc canvas (`#ffffff` / `#f4f4f5`), slate borders (`#e4e4e7`), charcoal text (`#09090b`).
- **Brand Accent Gradient**: Strictly reserved for brand accents, active focus rings, and action badges:
  ```
  indigo (#6366f1) → violet (#8b5cf6) → cyan (#06b6d4)
  ```

### Tooling Stack
- **Framework**: Next.js 16 (App Router with Turbopack, React 19)
- **Styling**: Tailwind CSS v4 (CSS-first engine with `@theme` directives in [`globals.css`](file:///e:/DevProjects/COS/frontend/src/app/globals.css))
- **Icons**: Lucide React
- **Class Utilities**: `clsx`, `tailwind-merge`, `class-variance-authority`

---

## 2. Directory Manifest & Architecture Pattern

Career OS implements a **Feature-Driven Architecture** separating core application infrastructure from modular domain features.

```
frontend/src/
├── app/                          # Next.js App Router (Layouts, Pages, Route Handlers)
├── core/                         # Cross-cutting primitives & application foundation
│   ├── components/
│   │   ├── layout/               # Global shell layouts (Header, Sidebar, CommandPalette)
│   │   └── ui/                   # Reusable UI primitives (Button, Input, Modal, Badge)
│   ├── config/                   # Global configuration & environment constants
│   ├── hooks/                    # Cross-cutting hooks (useTheme, useDebounce, etc.)
│   ├── lib/                      # Base utilities & HTTP API client instance
│   ├── providers/                # React context providers (Theme, Toast, Query)
│   └── types/                    # Common API response envelopes & global types
└── features/                     # Domain modules dynamically mirroring backend services
    ├── auth/                     # Authentication, sessions, user credentials
    ├── ingest/                   # Roadmap ingestion (PDF, Drive URL, Web scraping)
    ├── roadmaps/                 # Roadmap trees, nodes, topic categorizations
    ├── submissions/              # LeetCode submissions, code hashing, GitHub sync
    ├── problems/                 # DSA problems, difficulty tags, progress tracking
    └── settings/                 # GitHub configs, API keys, user profile
```

---

## 3. Detailed Folder & File Responsibility Guide

### 3.1. `src/core/` (Cross-Cutting Foundation)

| Folder | Intended Files | Logic & Responsibility |
| :--- | :--- | :--- |
| `core/components/ui/` | `button.tsx`<br>`input.tsx`<br>`dialog.tsx`<br>`badge.tsx`<br>`dropdown.tsx`<br>`skeleton.tsx`<br>`card.tsx`<br>`toast.tsx` | Pure, unopinionated presentation primitives built with Tailwind v4 and CVA. Zero business logic. Must accept `ref`, support keyboard navigation, and adhere to dark/light design tokens. |
| `core/components/layout/` | `app-header.tsx`<br>`app-sidebar.tsx`<br>`command-palette.tsx`<br>`breadcrumbs.tsx`<br>`user-nav.tsx` | Structural components orchestrating the app shell. Manages navigation links, theme toggle switches, breadcrumb generation, and global `Cmd+K` command search. |
| `core/config/` | `env.ts`<br>`routes.ts`<br>`constants.ts` | Validates client-side environment variables (`NEXT_PUBLIC_API_URL`), declares static route path dictionaries, and defines system pagination/layout limits. |
| `core/hooks/` | `use-theme.ts`<br>`use-debounce.ts`<br>`use-media-query.ts`<br>`use-command-palette.ts`<br>`use-click-outside.ts` | Shared lifecycle and UI behavior hooks. E.g., `useDebounce` for search inputs, `useCommandPalette` for modal open/close shortcuts. |
| `core/lib/` | `utils.ts`<br>`api-client.ts`<br>`formatters.ts` | `utils.ts` contains `cn()` for Tailwind class composition. `api-client.ts` wraps `fetch`/Axios with automatic Authorization bearer headers, automatic 401 token refresh triggers, and normalized error throwing. |
| `core/providers/` | `theme-provider.tsx`<br>`query-provider.tsx`<br>`toast-provider.tsx` | Client context wrappers mounted in RootLayout. Supplies theme state (`light`/`dark`), server-state cache (TanStack Query / SWR), and global notification toasts. |
| `core/types/` | `index.ts`<br>`api.ts` | Defines `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, and standard UI `ViewState` (`loading`, `empty`, `error`, `success`, `idle`). |

---

### 3.2. `src/features/` (Domain-Driven Modules)

Every feature module is encapsulated with a strict 4-folder convention:
1. `components/` — Feature-scoped UI components.
2. `hooks/` — Feature-scoped data fetching, mutation, and state hooks.
3. `services/` — Feature-scoped API client functions.
4. `types/` — Feature-scoped domain models and request/response DTOs.
5. `index.ts` — Public barrel export providing a clear interface to other modules.

#### 1. Feature: `features/auth/`
*Handles user authentication, session persistence, registration, email verification, and token rotation.*
- **Files**:
  - `components/login-form.tsx`: Handles email/password authentication submission.
  - `components/register-form.tsx`: Collects user signup details and initiates verification.
  - `components/verify-email-form.tsx`: Code/OTP input for verifying user email.
  - `components/oauth-buttons.tsx`: Google/GitHub sign-in triggers.
  - `hooks/use-auth.ts`: Provides current user state (`user`, `isAuthenticated`, `isLoading`).
  - `hooks/use-login.ts`: Mutation hook triggering login request and setting session cookie/storage.
  - `hooks/use-register.ts`: Mutation hook for registration with error handling.
  - `services/auth-api.ts`: API methods: `login()`, `register()`, `verifyEmail()`, `resendVerification()`, `logout()`, `getMe()`.
  - `types/index.ts`: `User`, `AuthSession`, `LoginPayload`, `RegisterPayload`, `AuthTokens`.

#### 2. Feature: `features/roadmaps/`
*Handles viewing, organizing, navigating, and managing career and learning roadmaps.*
- **Files**:
  - `components/roadmap-card.tsx`: Summary card showing title, completion percentage, and topic counts.
  - `components/roadmap-tree.tsx`: Interactive node tree rendering roadmap hierarchy and problem nodes.
  - `components/topic-section.tsx`: Grouping of problems under a specific topic (e.g., Arrays, DP).
  - `components/roadmap-progress-bar.tsx`: Visual progress indicator with brand gradient highlights.
  - `hooks/use-roadmaps.ts`: Fetches all roadmaps belonging to the authenticated user.
  - `hooks/use-roadmap-detail.ts`: Fetches hierarchical roadmap tree and associated problems.
  - `hooks/use-delete-roadmap.ts`: Mutation hook to remove a roadmap with optimistic UI updates.
  - `services/roadmap-api.ts`: API methods: `getRoadmaps()`, `getRoadmapById(id)`, `createRoadmap(data)`, `deleteRoadmap(id)`.
  - `types/index.ts`: `Roadmap`, `RoadmapProblem`, `TopicGroup`, `RoadmapStatus`.

#### 3. Feature: `features/ingest/`
*Handles uploading and extracting roadmaps from external sources (PDF files, Google Drive links, URLs).*
- **Files**:
  - `components/ingest-modal.tsx`: Modal dialog containing import tabs (PDF upload, URL import).
  - `components/pdf-dropzone.tsx`: Drag-and-drop file upload zone with format and size validation.
  - `components/drive-url-input.tsx`: Input field for Google Drive or web URLs with validation.
  - `components/ingest-progress-card.tsx`: Processing indicator displaying parse status.
  - `hooks/use-ingest-url.ts`: Mutation hook for URL/Drive submissions.
  - `hooks/use-ingest-file.ts`: Mutation hook for PDF file multipart uploads.
  - `services/ingest-api.ts`: API methods: `ingestUrl(payload)`, `ingestFile(formData)`.
  - `types/index.ts`: `IngestJobRequest`, `IngestJobResponse`, `IngestStatus`.

#### 4. Feature: `features/submissions/`
*Handles LeetCode problem submissions, code execution metrics, LLM annotations, and GitHub repository sync status.*
- **Files**:
  - `components/submission-history-table.tsx`: Filterable table of past problem submissions.
  - `components/annotated-code-viewer.tsx`: Syntax-highlighted viewer with LLM complexity badges and annotations.
  - `components/github-sync-status-badge.tsx`: Visual indicator (`SYNCED`, `PENDING`, `FAILED`).
  - `components/retry-sync-button.tsx`: Button to re-trigger GitHub push worker.
  - `hooks/use-submissions.ts`: Queries user submissions with platform/date filtering.
  - `hooks/use-retry-sync.ts`: Triggers re-sync mutation for failed GitHub commits.
  - `services/submission-api.ts`: API methods: `listSubmissions()`, `retrySync(problemId)`.
  - `types/index.ts`: `Submission`, `GithubSyncStatus`, `LlmStatus`, `AnnotatedCodeData`.

#### 5. Feature: `features/problems/`
*Handles DSA problem catalogs, difficulty categorization, progress state tracking (Solved, Attempted, Revise).*
- **Files**:
  - `components/problem-table.tsx`: Main problem tracking grid with title, platform, difficulty, and status.
  - `components/problem-filter-bar.tsx`: Search and filter controls (status, difficulty, platform).
  - `components/difficulty-badge.tsx`: Color-coded badges (`EASY`, `MEDIUM`, `HARD`).
  - `components/status-dropdown.tsx`: Interactive selector to toggle problem progress state.
  - `components/revision-notes-drawer.tsx`: Slide-over drawer displaying Markdown revision notes.
  - `hooks/use-problems.ts`: Fetches filtered and sorted problem lists.
  - `hooks/use-update-problem-status.ts`: Optimistic mutation updating progress events.
  - `services/problems-api.ts`: API methods: `getProblems()`, `updateProblemStatus(id, status)`.
  - `types/index.ts`: `Problem`, `Difficulty`, `ProgressStatus`, `ProgressEvent`.

#### 6. Feature: `features/settings/`
*Handles user profile settings, GitHub personal access token configuration, and browser extension API key generation.*
- **Files**:
  - `components/api-key-list.tsx`: Table of active API keys with creation dates, prefix, and revoke buttons.
  - `components/create-api-key-modal.tsx`: Modal generating new `cos_live_...` extension keys.
  - `components/github-config-card.tsx`: GitHub PAT, repository, and branch connection form.
  - `components/github-verify-button.tsx`: Connection test button verifying repo write permissions.
  - `hooks/use-api-keys.ts`: Fetches and caches active API keys.
  - `hooks/use-create-api-key.ts`: Creates a new API key and reveals the full secret once.
  - `hooks/use-revoke-api-key.ts`: Revokes an API key with instant invalidation.
  - `hooks/use-github-config.ts`: Loads user's current GitHub sync settings.
  - `hooks/use-update-github-config.ts`: Saves encrypted GitHub config.
  - `services/settings-api.ts`: API methods: `listApiKeys()`, `createApiKey()`, `revokeApiKey()`, `getGithubConfig()`, `updateGithubConfig()`, `verifyGithubConfig()`.
  - `types/index.ts`: `ApiKey`, `GithubConfig`, `UpdateGithubConfigPayload`.

---

## 4. End-to-End System Mapping (Frontend → Backend → Database)

| Feature Module | Frontend Service Method | Backend Endpoint & Method | Backend Controller & Service | DBML Schema Tables |
| :--- | :--- | :--- | :--- | :--- |
| **`auth`** | `register(payload)` | `POST /api/v1/auth/register` | `AuthController.registerUser`<br>`AuthService.register` | `users` |
| **`auth`** | `login(payload)` | `POST /api/v1/auth/login` | `AuthController.loginUser`<br>`AuthService.login` | `users`, `sessions` |
| **`auth`** | `verifyEmail(payload)` | `POST /api/v1/auth/verify-email` | `AuthController.verifyEmail`<br>`AuthService.verifyEmail` | `users` |
| **`auth`** | `getMe()` | `GET /api/v1/auth/me` | `AuthController.getMe` | `users` |
| **`auth`** | `logout()` | `POST /api/v1/auth/logout` | `AuthController.logoutUser` | `sessions` |
| **`roadmaps`** | `getRoadmaps()` | `GET /api/v1/roadmaps` | `RoadmapController.getUserRoadmaps`<br>`RoadmapService.getUserRoadmaps` | `roadmaps` |
| **`roadmaps`** | `getRoadmapById(id)` | `GET /api/v1/roadmaps/:id` | `RoadmapController.getRoadmapById`<br>`RoadmapService.getRoadmapWithProblems` | `roadmaps`, `roadmap_problems`, `problems` |
| **`roadmaps`** | `createRoadmap(data)` | `POST /api/v1/roadmaps` | `RoadmapController.createRoadmap`<br>`RoadmapService.createRoadmap` | `roadmaps` |
| **`roadmaps`** | `deleteRoadmap(id)` | `DELETE /api/v1/roadmaps/:id` | `RoadmapController.deleteRoadmap` | `roadmaps` |
| **`ingest`** | `ingestUrl(data)` | `POST /api/v1/ingest/url` | `ingest.controller.ts (ingestUrl)`<br>`services/ingestion/` | `roadmaps` |
| **`ingest`** | `ingestFile(formData)` | `POST /api/v1/ingest/file` | `ingest.controller.ts (ingestFile)`<br>`services/extractors/` | `roadmaps` |
| **`submissions`**| `listSubmissions()` | `GET /api/v1/submissions` | `SubmissionController.listUserSubmissions`<br>`submission.service.ts` | `submissions`, `problems` |
| **`submissions`**| `retrySync(problemId)` | `POST /api/v1/submissions/:problemId/retry-sync` | `SubmissionController.retrySync`<br>`githubSync.service.ts` | `submissions`, `github_configs` |
| **`problems`** | `getProblems()` | Interleaved with Roadmaps & Progress | `problems.service.ts`<br>`problems.repository.ts` | `problems`, `progress_events` |
| **`settings`** | `listApiKeys()` | `GET /api/v1/settings/api-keys` | `SettingsController.listApiKeys`<br>`apiKey.repository.ts` | `api_keys` |
| **`settings`** | `createApiKey(data)` | `POST /api/v1/settings/api-keys` | `SettingsController.createApiKey`<br>`apiKey.repository.ts` | `api_keys` |
| **`settings`** | `revokeApiKey(id)` | `DELETE /api/v1/settings/api-keys/:id` | `SettingsController.revokeApiKey`<br>`apiKey.repository.ts` | `api_keys` |
| **`settings`** | `getGithubConfig()` | `GET /api/v1/settings/github` | `SettingsController.getGithubConfig`<br>`githubConfig.repository.ts` | `github_configs` |
| **`settings`** | `updateGithubConfig()`| `PUT /api/v1/settings/github` | `SettingsController.updateGithubConfig`<br>`githubConfig.repository.ts` | `github_configs` |
| **`settings`** | `verifyGithubConfig()`| `POST /api/v1/settings/github/verify` | `SettingsController.verifyGithubConfig`<br>`githubSync.service.ts` | `github_configs` |

---

## 5. Browser Route Paths & Next.js App Router Structure

The Next.js App Router utilizes Route Groups to isolate layouts:
- `(auth)`: Clean, centered layout for unauthenticated flows.
- `(dashboard)`: Authenticated layout with Sidebar, Header, Breadcrumbs, and Command Palette.

```
src/app/
├── layout.tsx                                 # Root HTML shell & ThemeProvider
├── page.tsx                                   # Landing / root redirect to /roadmaps or /login
├── (auth)/
│   ├── layout.tsx                             # Centered card layout for auth
│   ├── login/page.tsx                         # /login
│   ├── register/page.tsx                      # /register
│   └── verify-email/page.tsx                  # /verify-email
└── (dashboard)/
    ├── layout.tsx                             # AppHeader, AppSidebar, CommandPalette shell
    ├── roadmaps/
    │   ├── page.tsx                           # /roadmaps
    │   ├── [id]/page.tsx                      # /roadmaps/:id
    │   └── import/page.tsx                    # /roadmaps/import
    ├── tracker/
    │   └── page.tsx                           # /tracker (Problems & Progress Grid)
    ├── submissions/
    │   ├── page.tsx                           # /submissions (Submission History & Sync Log)
    │   └── [id]/page.tsx                      # /submissions/:id (Annotated Code View)
    └── settings/
        ├── page.tsx                           # /settings (Profile & Account)
        ├── github/page.tsx                    # /settings/github (GitHub Sync Config)
        └── api-keys/page.tsx                  # /settings/api-keys (Extension API Keys)
```

### Detailed Route Specifications

| Browser URL Path | Next.js Page File | Features & Components Mounted | View States Handled |
| :--- | :--- | :--- | :--- |
| **`/`** | `src/app/page.tsx` | Root redirect based on auth status | Redirects to `/roadmaps` if authenticated, or `/login` |
| **`/login`** | `src/app/(auth)/login/page.tsx` | `features/auth/components/login-form.tsx`<br>`oauth-buttons.tsx` | Form validation errors, loading spinner, redirect on success |
| **`/register`** | `src/app/(auth)/register/page.tsx` | `features/auth/components/register-form.tsx` | Validation states, duplicate email error, success redirect to verify |
| **`/verify-email`** | `src/app/(auth)/verify-email/page.tsx` | `features/auth/components/verify-email-form.tsx` | OTP input, resend timer, error/success toast |
| **`/roadmaps`** | `src/app/(dashboard)/roadmaps/page.tsx` | `features/roadmaps/components/roadmap-card.tsx`<br>`features/ingest/components/ingest-modal.tsx` | **Loading**: Skeleton grid<br>**Empty**: "No roadmaps yet" CTA<br>**Error**: Retry banner |
| **`/roadmaps/[id]`** | `src/app/(dashboard)/roadmaps/[id]/page.tsx` | `features/roadmaps/components/roadmap-tree.tsx`<br>`topic-section.tsx`<br>`features/problems/components/status-dropdown.tsx` | **Loading**: Tree skeleton<br>**Active**: Interactive nodes & status toggling |
| **`/roadmaps/import`**| `src/app/(dashboard)/roadmaps/import/page.tsx` | `features/ingest/components/pdf-dropzone.tsx`<br>`drive-url-input.tsx`<br>`ingest-progress-card.tsx` | File drag states, parsing progress, redirect to roadmap on finish |
| **`/tracker`** | `src/app/(dashboard)/tracker/page.tsx` | `features/problems/components/problem-table.tsx`<br>`problem-filter-bar.tsx`<br>`revision-notes-drawer.tsx` | **Loading**: Table skeleton<br>**Active**: Search, filter, inline status updates |
| **`/submissions`** | `src/app/(dashboard)/submissions/page.tsx` | `features/submissions/components/submission-history-table.tsx`<br>`github-sync-status-badge.tsx` | **Loading**: Row skeletons<br>**Active**: Filter by sync status, retry sync |
| **`/submissions/[id]`**| `src/app/(dashboard)/submissions/[id]/page.tsx` | `features/submissions/components/annotated-code-viewer.tsx`<br>`retry-sync-button.tsx` | Code highlighting, step-by-step AI notes, complexity metrics |
| **`/settings`** | `src/app/(dashboard)/settings/page.tsx` | `features/settings/components/profile-settings-card.tsx` | User email display, password change, verification status |
| **`/settings/github`** | `src/app/(dashboard)/settings/github/page.tsx` | `features/settings/components/github-config-card.tsx`<br>`github-verify-button.tsx` | PAT mask, repository test connection status, sync branch selector |
| **`/settings/api-keys`**| `src/app/(dashboard)/settings/api-keys/page.tsx`| `features/settings/components/api-key-list.tsx`<br>`create-api-key-modal.tsx` | **Empty**: "No keys generated"<br>**Active**: One-time secret copy modal |

---

## 6. View States Contract

Per [AGENTS.md](file:///e:/DevProjects/COS/AGENTS.md), every screen and feature component must implement the 5 essential states:

1. **Loading State**: Geometry-matched Skeleton placeholders (`core/components/ui/skeleton.tsx`), eliminating layout shift.
2. **Empty State**: Minimalist zinc illustration/icon, concise explanatory copy, and a primary CTA button.
3. **Error State**: Non-blocking banner or inline alert with human-readable error description and a direct "Retry" action.
4. **Success State**: Immediate optimistic UI update paired with a subtle, non-intrusive toast notification.
5. **Active/Interactive State**: Clear keyboard focus rings (`focus-visible:ring-1 focus-visible:ring-indigo-500`), smooth transitions, and responsive mobile adaptations.

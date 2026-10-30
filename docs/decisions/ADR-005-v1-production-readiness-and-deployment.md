# ADR-005: Career OS v1 Production Readiness, Security Hardening & Deployment Architecture

## Status
**Accepted**

## Context
As Career OS approaches its v1 release, an architectural audit across the frontend (Next.js 16), backend (Express 5 + Prisma), database (PostgreSQL + Redis), and the companion Chrome extension (`cos-leet`) revealed several critical functional blockers and gaps in production operational readiness:

1. **Prisma Query Crashes**: Non-unique composite arguments passed to Prisma's `findUnique` and `delete` methods cause unhandled runtime exceptions when viewing, polling, or deleting roadmaps.
2. **Missing Progress Persistence**: Problem completion toggling is only held in local React component state; progress resets on refresh, and the backend lacks an HTTP endpoint to update problem progress.
3. **Broken Settings Integration**: Settings page queries a non-existent `GET /settings` route (404) and fails to fetch existing API keys or GitHub configurations on mount.
4. **Curated Roadmap Mock Trap**: Selecting curated roadmaps (e.g. NeetCode 150) redirects to an isolated client mock route (`sample-neetcode-150`) whose solves are not tracked in PostgreSQL.
5. **Session Expiration Gaps**: Lack of client-side `AuthGuard` inside `(dashboard)/layout.tsx` causes UI flickers or failed API cascades when JWTs expire during active browser sessions.
6. **Hardcoded Extension Endpoints**: `cos-leet` hardcodes `localhost:5000` and `localhost:3000` in fetch calls and manifest permissions, preventing live production usage.
7. **Production DevOps & Security**: Insecure fallback secrets in `env.ts`, `cors` origin reflection, unhandled worker orchestration (BullMQ workers do not run in `server.ts`), and missing automated migration deploy scripts.

This ADR establishes the technical decisions, architecture contracts, and implementation plan required to resolve these gaps and harden Career OS for v1 deployment.

---

## Decisions

### 1. Prisma Query Correction in `RoadmapRepository`
- **Problem**: Prisma throws `Argument where of type RoadmapWhereUniqueInput needs at least one of id, but provided id and userId` because `Roadmap` does not have a `@@unique([id, userId])` compound constraint.
- **Decision**: 
  - Update `findRoadmapById` and `findRoadmapStatusById` to use `prisma.roadmap.findFirst({ where: { id, userId } })`.
  - Update `deleteRoadmap` to first verify ownership via `findFirst({ where: { id, userId } })` (throwing `NotFoundError` if missing), and then execute deletion strictly by primary key `prisma.roadmap.delete({ where: { id } })`.

### 2. End-to-End Problem Progress Persistence
- **Backend**:
  - Expose `POST /api/v1/progress/:problemId` via `ProgressController` and `progress.routes.ts`.
  - Validate request payload using Zod (`status: ProgressStatus`, `aiNotes?: string`).
  - Invoke existing `ProgressRepository.upsertProgressEvent(userId, problemId, status, aiNotes)`.
  - Mount under `/api/v1/progress` in `backend/src/routes/v1/index.ts`.
- **Frontend**:
  - Create `frontend/src/features/problems/services/problem.service.ts` with `updateProblemProgress(problemId, status)`.
  - Implement **Optimistic UI with Rollback** in `RoadmapView.toggleProblemStatus`:
    1. Snapshot current roadmap state.
    2. Immediately update React state (0ms latency).
    3. Fire background network request.
    4. Roll back to the snapshot and notify user if the network request fails.

### 3. Settings API Connection & Hydration
- **Decision**:
  - Replace `GET /settings` with concurrent requests via `Promise.all([apiClient.get('/settings/api-keys'), apiClient.get('/settings/github')])` inside `fetchSettings()`.
  - Add a mount `useEffect` in `SettingsPage` to load initial keys and GitHub repository configuration, setting `isVerified` and populating form states.

### 4. Curated Roadmap Personalization
- **Decision**:
  - Prevent users from getting stranded on non-persisting `sample-neetcode-150` mock views.
  - When importing a curated roadmap (NeetCode 150), backend automatically provisions or clones the curated topics/problems into a real `Roadmap` entity for the authenticated user via `cloneRoadmapWithProblems`.
  - The client redirects directly to `/dashboard/roadmap/:id` (real UUID) where real progress tracking takes effect.

### 5. Multi-Layer Route Protection (Defense-in-Depth)
- **Layer 1 (Network Boundary / SSR)**: Next.js 16 Proxy Middleware (`frontend/src/proxy.ts`) checks cookies before server-rendering `/dashboard/*` or `/roadmaps/*`, returning HTTP 307 redirects to `/login?from=...` for unauthenticated requests.
- **Layer 2 (Client Application / SPA)**: Client `AuthGuard` in `(dashboard)/layout.tsx` monitors session state via `useAuth()`. If the session expires or is terminated, it displays a branded skeleton and transitions smoothly to `/login` without exposing private dashboard widgets.

### 6. Security Hardening & Secret Governance
- **Environment Validation**:
  - In `backend/src/config/env.ts`, enforce that when `NODE_ENV === 'production'`, `ACCESS_TOKEN_SECRET`, `COOKIE_SECRET`, and `ENCRYPTION_KEY` **must** be provided and must satisfy minimum entropy requirements ($\ge 32$ characters). Insecure dev fallbacks are strictly prohibited at boot.
  - Document all production variables in `backend/.env.example` and `frontend/.env.example`.
- **Cookie Policy**:
  - Use `sameSite: 'lax'` for session tokens (allows top-level incoming navigations from emails/notifications).
  - Add optional `COOKIE_DOMAIN` (e.g. `.careeros.dev`) to support cross-subdomain access between `app.careeros.dev` and `api.careeros.dev`.
- **CORS Hardening**:
  - Disallow wildcard `origin: true` reflection when `credentials: true`. Enforce strict matching against `FRONTEND_URL` / `CORS_ORIGIN`.
- **Resilient Rate Limiting**:
  - Configure `passOnStoreError: true` on Redis rate limiter stores to fail-open during transient Redis blips, preventing service-wide 500 errors. Remove `console.log` from the rate limiting hot path.
- **Security Headers**:
  - Integrate `helmet` in Express to enforce HSTS, MIME sniffing protection, and clickjacking prevention.

### 7. Background Worker & Infrastructure Orchestration
- **Worker Execution Model**:
  - BullMQ workers (`email`, `ingestion`, `submission`, `githubsync`) must run alongside the web server.
  - Support two deployment topologies:
    1. *Distributed / Standard*: Dedicated worker process via `npm run workers` (`src/workers/index.ts`) running on a separate worker dyno/container.
    2. *Consolidated / Single-Container*: Controlled by `RUN_EMBEDDED_WORKERS=true` inside `server.ts` to spin up workers in-process for low-cost / hobby tiers.
- **Database Migrations**:
  - Add `"db:deploy": "prisma migrate deploy"` to `backend/package.json`.
  - Ensure migration execution is tied to the production release phase before starting HTTP listeners.
- **Health Checks & Graceful Termination**:
  - Protect `/health` with `try/catch` and verify both PostgreSQL (`SELECT 1`) and Redis (`redisClient.ping()`).
  - Expand `handleShutdown` in `server.ts` to call `await prisma.$disconnect()` and `await redisClient.quit()`.

### 8. Chrome Extension (`cos-leet`) Production Readiness
- Parameterize the submission ingestion endpoint via `import.meta.env.VITE_API_URL` with fallback to user configuration in the popup.
- Update `manifest.json` `host_permissions` to include the production API origin (e.g., `https://*.careeros.dev/*`).
- Add build documentation for packaging `cos-leet/dist` into a Web Store `.zip`.

---

## Affected Components

| Component | Target Files | Nature of Change |
| :--- | :--- | :--- |
| **Backend DB** | `backend/src/repositories/roadmap.repository.ts` | Replace invalid `findUnique`/`delete` calls with `findFirst` + PK delete. |
| **Backend API** | `backend/src/controllers/progress.controller.ts`<br>`backend/src/routes/v1/progress.routes.ts`<br>`backend/src/routes/v1/index.ts` | Add `POST /api/v1/progress/:problemId` route and controller. |
| **Backend Security** | `backend/src/config/env.ts`<br>`backend/src/app.ts`<br>`backend/src/middleware/rateLimit.middleware.ts`<br>`backend/src/utils/tokens.ts` | Enforce secrets, strict CORS, `passOnStoreError`, `sameSite: 'lax'`, Helmet. |
| **Backend DevOps** | `backend/src/server.ts`<br>`backend/package.json`<br>`backend/.env.example` | Graceful shutdown, health check, embedded worker flag, `db:deploy` script. |
| **Frontend UI** | `frontend/src/features/roadmaps/components/roadmap.tsx`<br>`frontend/src/features/problems/services/problem.service.ts` | Wire optimistic progress toggling with network persistence. |
| **Frontend Settings**| `frontend/src/features/settings/services/setting-service.ts`<br>`frontend/src/features/settings/components/settings-page.tsx` | Fix 404, load API keys & GitHub config on mount. |
| **Frontend Auth** | `frontend/src/features/auth/components/auth-guard.tsx`<br>`frontend/src/app/(dashboard)/layout.tsx` | Implement client AuthGuard with skeleton loading. |
| **Frontend Ingest** | `frontend/src/app/(dashboard)/dashboard/import/page.tsx` | Wire curated import to database cloning instead of static mock data. |
| **Chrome Extension** | `cos-leet/src/handlers/ApiHandler.ts`<br>`cos-leet/manifest.json` | Make backend URL configurable and add production host permissions. |

---

## Consequences

### Positive
- **Zero Runtime Query Crashes**: Roadmaps load and delete reliably without Prisma schema validation failures.
- **Data Integrity & User Trust**: Solved problem states persist across reloads and sync with the user's career trajectory.
- **Security Hardening**: Hardened production secrets, safe credentialed CORS, robust rate limiting, and standard HTTP security headers.
- **Reliable Ingestion & Sync**: Background workers are guaranteed to run in production, ensuring email verification, AI extraction, and GitHub sync work out of the box.
- **Production-Ready Extension**: Chrome extension works seamlessly against live production endpoints.

### Trade-offs / Operational Requirements
- Production deployment requires configuring both a web service and a worker process (or enabling `RUN_EMBEDDED_WORKERS=true`).
- Managed Redis and PostgreSQL instances must be provisioned before deploying (e.g. Supabase/Neon + Redis Cloud/Upstash).
- Extension updates must be re-packaged and submitted to the Chrome Web Store when changing API domains.

---

## Verification & Acceptance Checklist

1. [ ] **Prisma Queries**: Navigating to `/dashboard/roadmap/:id` and deleting a roadmap return HTTP 200 without Prisma validation errors.
2. [ ] **Progress Persistence**: Toggling problem checkboxes persists to `progress_events` in PostgreSQL and survives hard browser refreshes.
3. [ ] **Settings Integration**: Opening `/dashboard/settings` displays existing API keys and saved GitHub repository information without console 404s.
4. [ ] **AuthGuard**: Navigating to `/dashboard` unauthenticated redirects to `/login`; expired tokens display skeleton before graceful redirection.
5. [ ] **Production Health**: `GET /health` reports `status: ok` verifying both PostgreSQL and Redis connectivity.
6. [ ] **Extension Ingestion**: `cos-leet` submits solutions successfully to the configured production API domain.

# Career OS — Engineering Problem & Architecture Decision Log

This document tracks technical challenges, architecture dilemmas, trade-offs evaluated, and engineering decisions made during the evolution of Career OS. It serves as an ongoing log for future reference and architectural alignment.

---

## Log Index

- [Entry 01 (2026-10-13): Non-Roadmap Submissions — "Default Roadmap" vs. "Global Solved Activity"](#entry-01-2026-10-13-non-roadmap-submissions--default-roadmap-vs-global-solved-activity)
- [Entry 02 (2026-10-13): Roadmap Ingestion Streaming — Webhooks vs. SSE vs. Smart Polling](#entry-02-2026-10-13-roadmap-ingestion-streaming--webhooks-vs-sse-vs-smart-polling)
- [Entry 03 (2026-10-24): V1 Production Readiness, Security Hardening & Pre-Deploy Blockers](#entry-03-2026-10-24-v1-production-readiness-security-hardening--pre-deploy-blockers)
- [Entry 04 (2026-10-29): Next.js Edge Proxy, Cookie Path Scoping & AuthContext Deadlock on Token Expiration](#entry-04-2026-10-29-nextjs-edge-proxy-cookie-path-scoping--authcontext-deadlock-on-token-expiration)

---

## Entry 01 (2026-10-13): Non-Roadmap Submissions — "Default Roadmap" vs. "Global Solved Activity"

### 1. Context & The Problem
The Career OS submission ingestion pipeline automatically receives solutions from the `cos-leet` Chrome extension:
1. Normalizes the code and verifies idempotency via Redis locks.
2. Upserts canonical problems (`problems` table).
3. Records user completion (`progress_events` with `status: SOLVED`).
4. Saves latest code revisions (`submissions` table) and dispatches AI revision notes and GitHub pushes.
5. In any roadmap owned by the user, problems matching the canonical problem are marked solved via relational joins.

**The Dilemma**:
What happens when a user solves a problem that is **not part of any imported roadmap** (such as LeetCode Problem of the Day (POTD), weekly contest problems, or spontaneous solves before importing any sheet)?
- In PostgreSQL, the problem and submission are safely stored.
- In the UI, problems were previously only accessible *nested inside specific roadmaps*.
- Consequently, standalone solves appeared "lost" from the user's visual perspective.

### 2. Evaluated Approach: Auto-Provisioned "Default / General Roadmap"
We initially evaluated creating a synthetic "Default / General Practice" roadmap for every user to capture unassigned solves.

**Why this was rejected (Architectural Pitfalls)**:
1. **Domain Mismatch (Semantic Smear)**:
   - A **Roadmap** in Career OS represents a curated curriculum with a finite milestone and syllabus (e.g. *NeetCode 150*, *Blind 75*). It has structured topics, ordering (`orderIndex`), and a definite target progress percentage ($45 / 75 = 60\%$).
   - A POTD or contest solve is **activity stream / solve history**, not a curriculum.
   - Forcing random solves into a roadmap breaks progress metrics: the denominator continuously increments, making completion percentages meaningless.
2. **Worker Coupling & Latency**:
   - `submissionWorker` is designed for ultra-fast, high-throughput database writes.
   - Forcing every submission to check: *"Does the user have any roadmap containing this problem? If not, find or create the default roadmap and insert a junction row"* introduces unnecessary database contention, locks, and couples ingestion workers directly to the roadmap domain.
3. **The Deduplication Dilemma**:
   - If a user solves *Two Sum* as a POTD today into the "Default Roadmap", and next week imports *NeetCode 150* (which also contains *Two Sum*), the problem now exists in both places. Either stats become duplicate/skewed, or complex reconciliation logic is required.

### 3. Final Decision: First-Class "Global Activity & Solved Problem Feed"
The existing schema was already decoupled: `Problem`, `ProgressEvent`, and `Submission` are first-class entities independent of `Roadmap`.

**The Solution**:
- **Separate Curriculum from Activity History**:
  - **Roadmaps**: Curated learning paths.
  - **Global Solved Problems / Activity**: A centralized list of all questions solved across POTD, contests, and roadmaps.
- **Roadmap as Metadata, Not Container**:
  - Standalone questions display a `[POTD / Standalone]` badge.
  - Problems inside a sheet display an `[In NeetCode 150]` badge.
- **Search & Filters**:
  - Unlocks a fast search bar (`Cmd + K` / text search) by slug, title, platform, and difficulty.
  - Adds quick filters: `All`, `In Roadmap`, `Standalone / POTD`.

---

## Entry 02 (2026-10-13): Roadmap Ingestion Streaming — Webhooks vs. SSE vs. Smart Polling

### 1. Context & The Problem
When a user imports a roadmap from a Google Sheet, Doc, or URL, the extraction pipeline runs asynchronously in the background via BullMQ:
- Step 1: Scrape & normalize source text (`1–3s`).
- Step 2: Sliding-window chunking & multi-pass Gemini LLM extraction (`10–30s`).
- Step 3: Canonical problem resolution and junction table persistence (`1–2s`).

The overall process takes **15 to 45 seconds**. The frontend needs to track progress so the user sees real-time status rather than an empty or frozen screen.

### 2. Architectural Comparison

| Approach | Direction | Architectural Fit | Complexity | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Webhooks** | Server $\rightarrow$ Server | ❌ Inapplicable | N/A | **Disqualified**: Browsers reside behind NAT/firewalls and cannot listen for incoming HTTP webhooks. |
| **WebSockets** | Full Duplex | ❌ Overkill | High | **Disqualified**: Ingestion status is strictly unidirectional (backend $\rightarrow$ client). Stateful socket connections add unnecessary operational overhead. |
| **Server-Sent Events (SSE)** | Server $\rightarrow$ Client | ✅ Good for granular streaming | Moderate (needs Redis Pub/Sub) | **Deferred**: Requires the API server to subscribe to Redis Pub/Sub channels published by background workers. Overkill for MVP when stage-based status is sufficient. |
| **Smart Polling** | Client $\rightarrow$ Server | ✅ Ideal for status tracking | Low | **Adopted**: Resilient across disconnects, tab switching, and page reloads with zero stateful backend overhead. |

### 3. Engineering Decisions for Ingestion Polling

#### A. Dedicated Lightweight Status Endpoint (Option B)
- **Problem with naive polling**: Polling `GET /api/v1/roadmaps/:id` every 2 seconds triggers heavy SQL joins across `roadmap_problems`, `problems`, `progress_events`, and `submissions`.
- **Solution**: We created a dedicated, lightweight endpoint:
  ```http
  GET /api/v1/ingest/status/:roadmapId
  ```
  This selects strictly `{ id, title, sourceType, sourceUrl, status, errorMessage, updatedAt, _count: { roadmapProblems } }` using an indexed primary key lookup. Only when status flips to `COMPLETED` does the frontend fetch full roadmap details once.

#### B. Domain Isolation (`frontend/src/features/ingest/`)
Following the project's strict domain boundary principles:
- **`features/ingest/services/ingest.service.ts`**: Contains `startUrlIngestion` and `fetchIngestStatus`.
- **`features/ingest/hooks/use-ingest-polling.ts`**:
  - Automatically ceases polling when status reaches `COMPLETED` or `FAILED`.
  - **Tab Visibility Guard**: Listens to `document.visibilityState`. Pauses polling when the browser tab is hidden to save battery and network, resuming immediately upon returning.
  - **Timeout Guard**: Caps polling at 70 attempts (~3 minutes) to prevent endless background loops.
  - **Unmount Protection**: Uses ref lifecycle trackers to prevent React state updates on unmounted views.
- **`features/ingest/components/ingest-progress.tsx`**:
  - Linear/Raycast-inspired multi-stage pipeline monitor (*1. Fetch Source* $\rightarrow$ *2. AI Analysis & Extraction* $\rightarrow$ *3. Finalize & Categorize*).
  - Explicit error handling with retry capability.

---

## Entry 03 (2026-10-24): V1 Production Readiness, Security Hardening & Pre-Deploy Blockers

### 1. Context & The Problem
In preparation for deploying Career OS v1 to production, a comprehensive audit was executed across the Next.js 16 frontend, Express 5 backend, PostgreSQL/Prisma schemas, and the `cos-leet` Chrome extension.

The audit revealed three classes of blockers:
1. **Critical Runtime Crashes (P0)**: Passing non-unique fields `where: { id, userId }` to Prisma's `findUnique` and `delete` in `RoadmapRepository` triggers runtime exceptions due to the lack of an `@@unique([id, userId])` compound index.
2. **Disconnected Core Features (P1)**: 
   - Toggling problem completion in `RoadmapView` is purely local React state; no HTTP call persists solved status to `progress_events`, wiping progress on refresh.
   - Settings page calls `GET /settings` (which 404s) and never populates existing API keys or GitHub config on mount.
   - Curated roadmaps like "NeetCode 150" navigate to an in-memory client mock (`sample-neetcode-150`) rather than cloning real problems into the user's database.
3. **Production Hardening Gaps (P2)**:
   - Insecure development fallback secrets in `env.ts` (`ACCESS_TOKEN_SECRET`, `COOKIE_SECRET`, `ENCRYPTION_KEY`).
   - CORS `origin: true` reflection when `credentials: true`.
   - BullMQ background workers (`email`, `ingestion`, `submission`, `githubsync`) are not launched by `server.ts` and require dedicated orchestration.
   - Chrome extension hardcodes `localhost:5000` and `localhost:3000`.

### 2. Engineering Decisions Summary
- **Prisma Lookups**: Transition `findRoadmapById` and status polling to `findFirst`, and enforce ownership checks before primary-key deletion.
- **Problem Progress**: Expose `POST /api/v1/progress/:problemId` and wire optimistic updates with error rollback in `RoadmapView`.
- **Settings Hydration**: Consolidate `GET /settings/api-keys` and `GET /settings/github` into a unified loader and hydrate `SettingsPage` on mount.
- **Production Defense**: Enforce production environment validations, `sameSite: 'lax'` session cookies, subdomain domain scoping, Helmet security headers, and fail-open rate limiting (`passOnStoreError: true`).
- **Worker Orchestration**: Support both dedicated worker processes (`src/workers/index.ts`) and an in-process embedded runner (`RUN_EMBEDDED_WORKERS=true`) for single-container hosts.
- **Formal ADR**: Full technical specification, architectural contracts, and checklist documented in [`ADR-005`](./decisions/ADR-005-v1-production-readiness-and-deployment.md).

---

## Entry 04 (2026-10-29): Next.js Edge Proxy, Cookie Path Scoping & AuthContext Deadlock on Token Expiration

### 1. Context & The Problem
In the Career OS architecture, authentication is shared between an Express API backend and a Next.js 16 App Router frontend protected by an Edge Proxy middleware (`frontend/src/proxy.ts`). 
- Sessions use dual JWT tokens: a short-lived `access_token` (15 minutes) and a long-lived `refresh_token` (7 days), both stored in HTTP-only cookies.
- When the `access_token` naturally expired after 15 minutes of user inactivity, navigating to any protected route (e.g., clicking on `/dashboard/settings` or `/dashboard/import`) triggered a critical failure:
  - The application redirected to `/login`.
  - The UI permanently froze on the loading spinner (`animate-spin`).
  - The actual login form never displayed until the user performed a manual hard browser refresh (**F5**).

### 2. Multi-Layered Root Cause Analysis

#### A. Layer 1: Cookie Path Scoping Flaw (RFC 6265)
In `backend/src/utils/tokens.ts`, the refresh token cookie was scoped to:
```typescript
export function getBaseRefreshTokenOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    signed: true,
    path: '/api/v1/auth', // <-- Root Cause
  };
}
```
- **The Pitfall**: An AI over-optimization following standard SPA tutorials scoped the cookie strictly to the auth endpoint.
- **The Failure**: Per RFC 6265, browsers strictly refuse to attach cookies whose path is `/api/v1/auth` when making requests to Next.js routes like `http://localhost:3000/dashboard/*`.
- When `proxy.ts` detected an expired `access_token` and attempted to silently call `POST /auth/refresh`, the forwarded `req.headers.get("cookie")` was missing `refresh_token`.
- The backend rejected the call with `401 Unauthorized: Refresh token missing`, wiped session cookies, and forced `proxy.ts` to redirect to `/login`.

#### B. Layer 2: Next.js Layout Lifecycle & Module-Level Cache Persistence
- In Next.js App Router, `RootLayout` (`src/app/layout.tsx`) hosts `<AuthProvider>`, which lives at the top of the component tree.
- During client-side navigation (`router.push` or middleware redirect following an RSC fetch), the root layout **does not unmount**.
- `auth-context.tsx` maintained module-scoped cache variables outside React state:
  ```typescript
  let cachedUser: AuthUser | null = null;
  let sessionRestored = false;
  ```
- When the proxy redirected the client navigation to `/login`:
  - `AuthProvider`'s `useEffect` was triggered by `pathname` changing to `/login`.
  - However, because `sessionRestored` was already `true` from the previous dashboard session, the hook executed:
    ```typescript
    if (sessionRestored) {
      setUser(cachedUser);
      setIsInitializing(false);
      return;
    }
    ```
  - `AuthProvider` falsely retained the stale user in React state, maintaining `isAuthenticated: true`.

#### C. Layer 3: Redirection Deadlock Loop in `LoginForm`
In `frontend/src/features/auth/components/login-form.tsx`:
```typescript
useEffect(() => {
  if (!isInitializing && isAuthenticated) {
    router.replace("/dashboard");
  }
}, [isAuthenticated, isInitializing, router]);

if (isInitializing || isAuthenticated) {
  return <Spinner />;
}
```
- Because `isAuthenticated` was still `true`, `LoginForm` continuously rendered the loading spinner.
- Simultaneously, its `useEffect` attempted to push the user back to `/dashboard`.
- The proxy intercepted `/dashboard`, verified the expired token, and redirected back to `/login`.
- This created an infinite client-server redirect bounce, locking the browser on the spinner.

#### D. Why Hard Refresh (F5) Bypassed the Bug
A manual page refresh tears down the browser's JavaScript V8 heap. All module variables (`cachedUser`, `sessionRestored`) reset to `null` and `false`. On the fresh initial mount at `/login`, `restoreSession` invoked `getCurrentUser({ skipAuthRefresh: true })`, caught the 401 error, and set `user: null`, finally allowing `isAuthenticated` to flip to `false`.

### 3. Engineering Decisions & Fix Strategy

1. **Backend Cookie Scoping (`backend/src/utils/tokens.ts`)**:
   - Change `path: '/api/v1/auth'` to `path: '/'`.
   - Allows Next.js Edge Proxy to receive `refresh_token` on page requests, execute silent background rotation, and append updated `set-cookie` headers without interrupting the user.
2. **Stale Cache Invalidation in `auth-context.tsx`**:
   - In `useEffect([pathname])`, check if `isAuthPage` is reached while `cachedUser` is still populated.
   - If landing on `/login` with a cached user, invalidate the stale memory cache (`cachedUser = null`, `sessionRestored = false`, `user = null`) because landing on an auth page implies the server rejected or cleared the session.
3. **Loop Guarding in Auth Forms (`login-form.tsx`, `register-form.tsx`)**:
   - Isolate initial loading (`isInitializing`) from authenticated state.
   - Prevent unconditional bounce-backs without verified active sessions.

### 4. Key Takeaways for Architecture & Interviews
- **Cookie Pathing in Full-Stack SSR/Edge Architectures**: Cookie paths must accommodate the ingress layer (Next.js server/proxy), not just the origin API. Scoping cookies to sub-paths breaks edge session rotation.
- **SPA In-Memory State vs. Server Redirects**: Next.js App Router client-side redirects do not reset module-level memory or root layout context. Client auth context must actively observe server authentication redirects and synchronize invalidations.


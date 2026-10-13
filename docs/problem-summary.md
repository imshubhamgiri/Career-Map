# Career OS — Engineering Problem & Architecture Decision Log

This document tracks technical challenges, architecture dilemmas, trade-offs evaluated, and engineering decisions made during the evolution of Career OS. It serves as an ongoing log for future reference and architectural alignment.

---

## Log Index

- [Entry 01 (2026-10-13): Non-Roadmap Submissions — "Default Roadmap" vs. "Global Solved Activity"](#entry-01-2026-10-13-non-roadmap-submissions--default-roadmap-vs-global-solved-activity)
- [Entry 02 (2026-10-13): Roadmap Ingestion Streaming — Webhooks vs. SSE vs. Smart Polling](#entry-02-2026-10-13-roadmap-ingestion-streaming--webhooks-vs-sse-vs-smart-polling)

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

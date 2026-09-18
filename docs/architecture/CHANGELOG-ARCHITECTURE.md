# Architecture Evolution

## 2026-09-11

- Backend ingestion flow implemented for URL and PDF.
- Prisma added.
- Database not yet connected.
- Planning PostgreSQL.
- Async ingestion planned with BullMQ.

## 2026-09-12

- Google Sheets ingestion
- Google Docs ingestion
- roadmap normalization
- AI extraction


## 2026-09-13

- logging and error handling
- docs and architecture documentation
- agent files and system prompts
- database schema 

## 2026-09-14
- Tiered LLM cascade parser implemented (Gemini 3.6 Flash primary, Groq 20b fallback).
- Established ADR-002: LLM cascade routing and Clone-on-Ingest SQL caching.
- Resolved TPM token limit saturation and output JSON schema truncation boundaries.
- Documented Clone-on-Ingest SQL pattern ensuring 0-token deduplication with 100% individual user data isolation.

## 2026-09-15
- Database schema aligned in `database/schema.dbml` and `backend/prisma/schema.prisma`.
- Added `status`, `error_message`, and `updated_at` to `roadmaps` for background execution lifecycle (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
- Added performance query indexes for user lookups, `source_url` cache checks, and canonical problem mapping.
- Migrated Prisma configuration to Prisma ORM v7: moved connection URLs from `schema.prisma` to `prisma.config.ts`.
- Configured PostgreSQL driver adapter `@prisma/adapter-pg` with `pg` connection pool and initialized singleton client in `backend/src/config/db.ts`.
- Implemented `UserRepository` and `RoadmapRepository` for database operations with Prisma ORM.
- Implemented `UserService` and `RoadmapService` for business logic and orchestration of database operations.
- Implemented `UserController` and `RoadmapController` for API endpoints and request handling.
- Implemented `validate.middleware.ts` for request validation using Zod schemas.
- Refactored `errorHandler.ts` for centralized error handling for Database and API errors.

- Refactored Tables with Enums and Constraints:
  - `roadmaps.status` ENUM: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.
  - `roadmaps.source_type` ENUM: `URL`, `PDF`, `GOOGLE_DOCS`, `GOOGLE_SHEETS`.
  - `problems.difficulty` ENUM: `EASY`, `MEDIUM`, `HARD` , `UNKNOWN`.
  - `progress.status` ENUM: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.
  - `users.email` UNIQUE constraint for user registration.

## 2026-09-17

- **Authentication & Session Architecture**:
  - Implemented end-to-end credential authentication endpoints (`/register`, `/login`, `/logout`, `/refresh`, `/me`) mounted under `/api/v1/auth` and `/api/v1/users`.
  - Added password hashing using **Argon2id** (`backend/src/utils/crypto.ts`) with 64MB memory cost and 3 time iterations.
  - Implemented dual-token mechanism:
    - Short-lived JWT access tokens (15 minutes).
    - Long-lived cryptographically secure opaque refresh tokens (40 random bytes hex, 7 days).
    - SHA-256 one-way hashing of refresh tokens before database storage.
  - Added `sessions` table in `database/schema.dbml` and `backend/prisma/schema.prisma` with `token_family`, `hashed_token` (unique), `revoked`, `expires_at`, `ip_address`, and `user_agent`.
  - Created and applied Prisma migration `20260917154422_add_sessions_table` to PostgreSQL.
  - Implemented **Refresh Token Rotation** with **Token Family Reuse Detection**: if a previously revoked refresh token is presented, all sessions in that `token_family` are revoked immediately to defend against session hijacking.
  - Integrated `cookie-parser` middleware with signed cookies for refresh tokens (`path: /api/v1/auth`, `httpOnly`, `sameSite: strict`) and standard cookies for access tokens.
  - Updated `authenticate` and `attachAuthContext` middlewares to seamlessly support both HTTP cookies and `Authorization: Bearer <token>` request headers.
  - Added `loginSchema` in `api.schema.ts` and `validateLoginBody` middleware to prevent validation conflicts with registration.
  - Created automated verification test suite in `backend/src/tests/auth.test.ts` verifying argon2 hashing, registration, login, token rotation, reuse invalidation, and session deletion.

## 2026-09-18

- **Canonical Problem Bank & Cross-Roadmap Progress Synchronization**:
  - Established **ADR-003**: Decoupled `problems` from `roadmaps` by introducing the `roadmap_problems` junction table.
  - `problems` table elevated to a global canonical problem bank with a `canonical_slug` (`UNIQUE`) representing the universal DSA concept (e.g. `two-sum`, `reverse-linked-list`).
  - `roadmap_problems` junction table preserves roadmap-specific metadata: `original_title`, `original_url`, `original_category`, `original_difficulty`, and `order_index`.
  - Added `GithubSyncStatus` ENUM (`NOT_SYNCED`, `PENDING`, `SYNCED`, `FAILED`) and sync tracking fields (`github_sync_status`, `github_repo`, `github_file_path`, `github_synced_at`) to `progress_events`.
  - Solved cross-roadmap progress sync: completing a problem in one roadmap immediately reflects in all other roadmaps containing that canonical problem for that user.
  - Designed the **Problem Identity Resolver & Batch Ingestion Matching Algorithm** using `WHERE canonical_slug IN (...)`, in-memory Map partitioning, and `createManyAndReturn` batch persistence for $O(1)$ query complexity.
  - Updated `database/schema.dbml` (source of truth) and `backend/prisma/schema.prisma`.

## future
- BullMQ async queue integration for background roadmap processing
- OAuth 2.0 provider integration (GitHub, Google)
- GitHub sync worker integration

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

## future
- PostgreSQL connection & initial migration execution
- auth & user persistence
- roadmap persistence & Clone-on-Ingest integration
- BullMQ async queue integration


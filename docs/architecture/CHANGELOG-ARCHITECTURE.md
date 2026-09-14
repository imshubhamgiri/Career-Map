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

## future
- roadmap persistence
- BullMQ async queue integration


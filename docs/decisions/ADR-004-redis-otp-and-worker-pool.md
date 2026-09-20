# ADR-004: Redis for Ephemeral OTP Storage and BullMQ Background Worker Pool

## Status
**Accepted**

## Context
Career OS requires two critical background capabilities:
1. **Authentic Email Verification**: New registrations and password reset flows require issuing transient 6-digit OTP codes with 15-minute expirations and 60-second resend rate limits. Persisting ephemeral OTP codes in PostgreSQL creates unnecessary table churn, autovacuum overhead, and requires manual cron tasks to purge expired records.
2. **Asynchronous Heavy Processing**: Dispatching emails via external network APIs (Resend) and extracting/chunking/parsing roadmap documents via LLMs (Gemini / Groq) block the main Express HTTP thread if executed synchronously.

We need a solution that offloads transient authentication challenges and heavy background jobs to a high-performance, non-blocking asynchronous architecture.

## Decision
1. **Redis for Ephemeral OTP Storage**: We adopt **Redis** as the single source of truth for transient authentication challenges (`otp:email_verify:<email>`) with automatic in-memory TTL (`EX 900`, 15 minutes) and atomic cooldown locks (`otp:cooldown:<email>`, `EX 60`).
2. **Durable Storage Separation**: **PostgreSQL** remains strictly for durable data (`users.is_email_verified`, `sessions`, `roadmaps`, `problems`, `progress_events`).
3. **BullMQ Worker Pool**: We adopt **BullMQ** with Redis for background job queuing:
   - `email-queue`: Handles asynchronous email delivery with exponential backoff retries ($3\times$).
   - `ingestion-queue`: Handles document extraction and LLM parsing with concurrency control.
4. **Standalone Worker Process**: Workers run in a dedicated process via `src/workers/index.ts` (`npm run worker`), supporting graceful termination handling (`SIGINT`/`SIGTERM`).

## Consequences

### Positive
- **Zero Database Bloat**: Ephemeral OTP records automatically expire and evict from Redis without touching PostgreSQL disk or requiring sweep jobs.
- **Ultra-Low API Latency**: Registration and ingestion HTTP endpoints return in `< 20ms` as heavy work is offloaded to Redis queues.
- **Resilience & Retries**: Transient failures in external email APIs or LLM services are automatically retried with exponential backoff without failing client HTTP requests.
- **Unified Infrastructure**: A single Redis instance powers both the ephemeral OTP cache and the distributed BullMQ queue cluster.

### Negative / Trade-offs
- Requires an active Redis instance (e.g. Docker container or managed Redis service).
- In development, background processing requires running the worker process (`npm run worker`) alongside the API server (`npm run dev`).

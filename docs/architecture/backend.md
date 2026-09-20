# Backend Architecture

## Design Principles

The Career OS backend is built with Node.js, Express, and TypeScript. It strictly enforces a layered architecture:

```mermaid
flowchart TD
    ClientReq["Client Request"] --> Route["Router (/api/v1)"]
    Route --> Middleware["Middleware (Upload, Zod Validation, Pino Logging)"]
    Middleware --> Controller["Controller (Thin Handler)"]
    Controller --> Service["Service Layer (Business Logic & Pipeline)"]
    Service --> Extractor["Extractors / LLM Adapters"]
    Service --> Repo["Repository / Prisma Client"]
    Repo --> DB[("PostgreSQL")]
    Controller -.->|AppError / Exceptions| ErrorHandler["Centralized Error Handler"]
```

## Directory Organization

```
backend/src/
├── app.ts                 # Express application configuration & middleware pipeline
├── server.ts              # Server startup & graceful shutdown
├── config/                # Environment, database, and Redis configuration (env.ts, db.ts, redis.ts)
├── controllers/           # HTTP request handlers (user.controller.ts, ingest.controller.ts)
├── errors/                # AppError class and centralized errorHandler middleware
├── middleware/            # Auth guard, Multer upload, Zod body/query validation
├── queues/                # BullMQ queue producers (email.queue.ts, ingestion.queue.ts)
├── repositories/          # Data access layer (user.repository.ts, roadmap.repository.ts)
├── routes/                # Central route tree (/api/v1/auth, /api/v1/ingest)
├── schemas/               # Zod validation schemas for requests and LLM outputs
├── services/              # Core business services
│   ├── email/             # Transactional email service (Resend / Dev logger)
│   ├── extractors/        # Source extractors (PDF, Google Sheets, Google Docs, Web)
│   ├── ingestion/         # Pipeline orchestration, chunking, LLM parsing
│   ├── otp/               # Ephemeral Redis OTP storage & atomic rate limiting
│   ├── problems.service.ts
│   ├── roadmap.service.ts
│   └── user.service.ts
├── tests/                 # Vitest automated test suites (auth.test.ts, ingest.test.ts, phase5.test.ts)
├── types/                 # Shared TypeScript interfaces & types
├── utils/                 # Utilities (crypto.ts, tokens.ts, logger.ts, canonicalSlug.ts)
└── workers/               # BullMQ background workers (index.ts, email.worker.ts, ingestion.worker.ts)
```

## Key Architectural Patterns

### 1. Thin Controllers
Controllers are responsible only for:
1. Extracting parameters from `req.body`, `req.query`, or `req.file`.
2. Calling the appropriate service function or enqueueing a background job.
3. Returning the response with standard HTTP status codes (< 20ms response time).
4. Catching unexpected errors and delegating to `next(err)`.

### 2. Service Separation
- Ingestion extraction logic is isolated in `src/services/extractors/`.
- Pipeline orchestration and batching logic reside in `src/services/ingestion/pipeline.service.ts`.
- LLM interaction and prompt structuring are encapsulated in `src/services/ingestion/llmParser.service.ts`.
- Identity and authentication orchestration reside in `src/services/user.service.ts`.
- Ephemeral OTP lifecycle and rate-limiting reside in `src/services/otp/redisOtp.service.ts`.
- Transactional email delivery resides in `src/services/email/email.service.ts`.

### 3. Repository Layer
- Encapsulates all Prisma ORM operations and database queries.
- Controllers and services do not execute direct SQL or Prisma queries; they invoke repository methods.
- Maintains strict types matching `@prisma/client` models.

### 4. Authentication & Session Architecture
- **Stateless Access Tokens**: Short-lived JWTs (15 min) carrying `userId` and `email` for low-latency authorization. Supported via HTTP cookies and `Authorization: Bearer <token>` headers.
- **Stateful Opaque Refresh Tokens**: Cryptographically random 40-byte hex strings stored as SHA-256 hashes in PostgreSQL `sessions`.
- **Refresh Token Rotation & Reuse Detection**: Rotating a refresh token revokes the previous token while preserving the `token_family`. If a compromised or revoked token is reused, all sessions in that family are immediately revoked.
- **Ephemeral Redis OTP Storage**: Short-lived verification codes (15-min TTL) and 60-second cooldown locks are managed directly in Redis, eliminating PostgreSQL table bloat.
- **Zero-Friction Auto-Login**: Upon submitting a valid OTP to `/verify-email`, the API immediately marks the user verified and issues access/refresh tokens in that response.

### 5. Background Queues & Asynchronous Processing (BullMQ & Redis)
- Heavy operations (sending emails over network, scraping documents, chunking, and calling LLM APIs) are completely decoupled from Express HTTP threads.
- **Queue Producers** (`src/queues/`) push jobs to Redis with exponential backoff retries.
- **Worker Pool** (`src/workers/`) runs in a separate process (`npm run worker`) consuming and executing jobs concurrently with graceful termination handling (`SIGINT`/`SIGTERM`).

### 6. Error Handling
- Throw `AppError(message, statusCode)` for predictable client errors.
- Uncaught exceptions or programming bugs are handled uniformly in `src/errors/errorHandler.ts`, returning a clean `{ success: false, error: message }` payload while logging detailed stack traces via Pino.

### 7. Logging
- Pino provides fast, structured JSON logging.
- HTTP requests are automatically logged with request IDs via `pino-http`.




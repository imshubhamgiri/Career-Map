# ⚡ Career OS

> **The Personal Career Operating System for Software Engineers**  
> *Unify roadmap ingestion, DSA progress tracking, AI revision notes, and automated GitHub backups in a single focused workspace.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ_Queues-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Groq](https://img.shields.io/badge/Groq-Llama_Fallback-F05A28?logoColor=white)](https://groq.com/)

---

## 📑 Table of Contents

- [Vision & Philosophy](#-vision--philosophy)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Core Design Decisions & Patterns](#-core-design-decisions--patterns)
- [Workflows & Sequence Diagrams](#-workflows--sequence-diagrams)
  - [1. Roadmap Ingestion & Canonical Identity Resolution](#1-roadmap-ingestion--canonical-identity-resolution)
  - [2. LeetCode Submission, AI Annotation & GitHub Sync](#2-leetcode-submission-ai-annotation--github-sync)
  - [3. Enterprise Authentication & Session Lifecycle](#3-enterprise-authentication--session-lifecycle)
- [Database Architecture & ERD](#-database-architecture--erd)
- [Repository Structure](#-repository-structure)
- [Quickstart & Local Setup](#-quickstart--local-setup)
- [Environment Configuration](#-environment-configuration)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Vision & Philosophy

### The Cognitive Fragmentation Problem
Engineers preparing for technical interviews or upskilling face continuous friction:
- **Scattered Curricula**: Roadmaps live in disparate formats—Google Sheets (Striver SDE Sheet), Notion pages, PDFs, and blog posts.
- **Disconnected Progress**: Solving a problem on LeetCode does not automatically update your personal tracking spreadsheet or study plan.
- **Forgotten Context**: Months after writing a complex solution, the intuition and edge-case handling are forgotten, with code lost across hundreds of GitHub commits.
- **Duplicate Work**: Following multiple curricula (e.g., Blind 75, NeetCode 150, Striver SDE) leads to solving the same problems multiple times without unified progress.

### The Career OS Solution
**Career OS** is engineered as a high-leverage workspace inspired by tools like **Linear**, **Raycast**, and **Vercel**:
1. **Effortless Ingestion**: Paste any URL (Google Sheets, Google Docs, technical articles) or upload a PDF; the AI extracts, structures, and creates an interactive checklist in seconds.
2. **Canonical Problem Bank**: Problems are resolved to a platform-agnostic canonical identity. Solving a problem once marks it completed across **every roadmap** containing that problem.
3. **Zero-Friction Ingestion via Chrome Extension**: Solve problems directly on LeetCode; our lightweight extension (`cos-leet`) captures accepted verdicts and syncs them in the background.
4. **AI Technical Authoring**: Automatically annotates your code with step-by-step logic and generates structured revision notes (Intuition, Approach, Big-O Complexity, Pitfalls).
5. **Clean GitHub Sync**: Formats and pushes code solutions to a designated personal GitHub repository under `solutions/<difficulty>/<canonical-slug>/`.

---

## 🏗 System Architecture

Career OS utilizes a decoupled, event-driven architecture combining a modern Next.js 16 frontend, a layered Express backend, asynchronous Redis/BullMQ background workers, and PostgreSQL with Prisma 7.

```mermaid
flowchart TD
    subgraph Clients["Clients Layer"]
        WebUI["Web Client (Next.js 16 App Router / Tailwind v4)"]
        Extension["Browser Extension (cos-leet)"]
    end

    subgraph Gateway["Backend Application Server (Express 5 / TypeScript)"]
        Router["Express Router (/api/v1)"]
        AuthMiddleware["Auth & API Key Guard"]
        RateLimiter["Redis Distributed Rate Limiter"]
        Controllers["Thin Controllers"]
    end

    subgraph Queues["Async Queue Layer (Redis + BullMQ)"]
        EmailQ["email-queue"]
        IngestQ["ingestion-queue"]
        SubQ["submission-queue"]
        GhSyncQ["github-sync-queue"]
    end

    subgraph Workers["Background Worker Pool"]
        W_Email["Email Worker (Resend)"]
        W_Ingest["Ingestion Worker (Extract & Parse)"]
        W_Sub["Submission Worker (3-Case Decision)"]
        W_GhSync["GitHub Sync Worker (2-Stage Checkpoint)"]
    end

    subgraph Intelligence["AI Parsing & Generation Layer"]
        GeminiFlash["Google Gemini Flash (Primary)"]
        GroqLLM["Groq Llama-3.3 / OSS (Failover)"]
    end

    subgraph Storage["Persistence & External Services"]
        PG[("PostgreSQL Database (Prisma 7)")]
        RedisStore[("Redis (OTP, Rate Limits, Dedupe Locks)")]
        GitHubAPI["GitHub Contents API (User Repo)"]
    end

    WebUI -->|HTTP / Cookies| Router
    Extension -->|x-api-key| Router
    Router --> RateLimiter --> AuthMiddleware --> Controllers

    Controllers -->|Enqueue Email| EmailQ
    Controllers -->|Enqueue Ingest Job| IngestQ
    Controllers -->|15s Redis Lock & Enqueue| SubQ
    Controllers -->|Read/Write| PG

    EmailQ --> W_Email
    IngestQ --> W_Ingest
    SubQ --> W_Sub
    GhSyncQ --> W_GhSync

    W_Ingest --> Intelligence
    W_Sub -->|State Check| PG
    W_Sub -->|Enqueue Stage 2| GhSyncQ
    W_GhSync --> Intelligence
    W_GhSync -->|Save Checkpoint| PG
    W_GhSync -->|Commit & Push| GitHubAPI
    W_Email -->|Deliver OTP| WebUI
```

---

## ✨ Key Features

| Capability | Description |
| :--- | :--- |
| **Multi-Source Ingestion** | Ingest roadmaps from **Google Sheets**, **Google Docs**, **PDF files**, and **generic web articles** using specialized extractors (Cheerio, `pdf-parse`, Google Docs/Sheets APIs). |
| **Canonical Identity Resolution** | Automatically generates platform-agnostic slugs (e.g., `two-sum`, `trapping-rain-water`). Prevents duplicate database entries and synchronizes progress across different roadmaps. |
| **Clone-on-Ingest Cache** | Instant SQL-level cloning (~5–10ms) when a submitted URL has already been processed by the system. Consumes **0 LLM tokens**. |
| **`cos-leet` Chrome Extension** | Runs seamlessly in the browser. Authenticates using scoped API keys (`cos_live_...`) and automatically catches accepted submissions on LeetCode. |
| **AI Algorithmic Annotation** | Analyzes accepted code without modifying logic. Adds inline step-by-step explanatory comments and generates structured markdown revision notes. |
| **Automated GitHub Backups** | Automatically pushes clean code and companion `README.md` files to your private or public GitHub repository under `solutions/<difficulty>/<slug>/`. |
| **Enterprise Dual-Token Auth** | 15-minute stateless JWT access tokens combined with 7-day stateful opaque refresh tokens stored as SHA-256 hashes with **Token Family Reuse Detection**. |
| **Ephemeral Redis OTP** | 6-digit email verification codes stored in Redis with 15-minute TTL, atomic cooldown timers, and zero PostgreSQL bloat. |
| **Linear / Raycast Aesthetic** | Minimalist UI built with Next.js 16, React 19, and Tailwind CSS v4. Complete Light and Dark theme support with subtle indigo-violet-cyan accents. |

---

## 🏛 Core Design Decisions & Patterns

### 1. Relational Source of Truth (`database/schema.dbml`)
- **Single Source of Truth**: All schema designs, tables, foreign keys, and indexes originate in `database/schema.dbml` before being reflected in `backend/prisma/schema.prisma`.
- **Relational Integrity**: Foreign keys enforce cascading deletions (`ON DELETE CASCADE`), ensuring orphaned problems or progress records are never left behind.
- **Data Preservation Rule**: Deleting a roadmap removes its `roadmap_problems` junction records, but preserves canonical `problems` and the user's `progress_events` history.

### 2. "Clone-on-Ingest" (Zero-Token Ingestion Caching)
When User B imports a public roadmap URL that was previously ingested by User A:
1. The system checks `roadmaps` for an existing completed extraction with matching `source_url`.
2. An atomic SQL transaction clones the roadmap structure and junction records for User B.
3. User B receives an isolated, fully editable roadmap in $\sim 5\text{ms}$ with **0 LLM tokens burned**.

### 3. Tiered Multi-LLM Extraction Pipeline
To prevent service degradation during upstream rate limits or outages:
- **Tier 1 (Google Gemini 3.6/3.8 Flash)**: Handles up to 350 normalized lines in a single shot with a 32,000 token output window. Larger documents are partitioned into 150-line chunks.
- **Tier 2 (Groq Fallback)**: If Gemini returns a 429 quota limit or network timeout, the pipeline seamlessly switches to Groq (`openai/gpt-oss-120b` or `llama-3.3-70b`) using 7-line chunks and 8-second exponential backoff retries.

### 4. 2-Stage Checkpointed Submission Pipeline
Submissions from the browser extension pass through a two-worker decoupled pipeline:
- **Worker 1 (`submissionWorker`)**: Runs a 3-Case Decision Matrix on `(userId, problemId)`:
  - **Case A (First Solve)**: Creates `ProgressEvent` (`SOLVED`) and `Submission` (`PENDING`).
  - **Case B (Identical Code)**: Matches `codeHash`. Updates timestamps only; skips downstream LLM and GitHub tasks.
  - **Case C (Updated/Better Code)**: Updates `Submission` in-place, resets statuses to `PENDING`, and triggers downstream processing.
- **Worker 2 (`githubSyncWorker`)**:
  - **Stage 1 (LLM Checkpoint)**: Evaluates complexity and generates revision notes, committing them immediately to PostgreSQL.
  - **Stage 2 (GitHub Push)**: Pushes code and markdown to GitHub. If GitHub authentication fails, the AI revision notes are safely checkpointed in PostgreSQL.

### 5. Multi-Layer Idempotency & Conflict-Free GitHub Push
- **Layer 1 (Frontend)**: Deduplication of concurrent button clicks.
- **Layer 2 (Network)**: Atomic 15-second Redis lock on `sub:dedupe:${userId}:${slug}:${codeHash}`.
- **Layer 3 (Database)**: Unique composite constraints on `(user_id, problem_id)`.
- **Layer 4 (Queue)**: Stale-job guard checks whether incoming `codeHash` matches the database before execution.
- **Layer 5 (GitHub API)**: Automatic SHA conflict recovery fetches the latest blob SHA on 409/422 responses and retries the commit.

### 6. Authentication with Token Family Reuse Detection
- Passwords are encrypted using **Argon2id** (64MB memory cost, 3 iterations, 4 parallelism threads).
- Refresh tokens are single-use 40-byte cryptographically secure hex strings stored as SHA-256 hashes.
- If a revoked token is replayed (indicating a potential token compromise), the entire `token_family` is revoked instantly across all active sessions.

---

## 🔄 Workflows & Sequence Diagrams

### 1. Roadmap Ingestion & Canonical Identity Resolution

```mermaid
flowchart TD
    User([User]) -->|Submit URL or PDF| API["POST /api/v1/ingest/url or /file"]
    API --> CheckCache{"Cached in DB?\n(source_url matches & !forceRefresh)"}

    subgraph FastPath["Fast Path (~5ms, 0 Tokens)"]
        CheckCache -- Yes --> CloneSQL["SQL Atomic Clone\nCopy Roadmap & roadmap_problems"]
        CloneSQL --> ReturnFast["200 OK (Instant)"]
    end

    subgraph Extraction["Extraction & Normalization"]
        CheckCache -- No --> Dispatcher["Extractor Dispatcher"]
        Dispatcher -->|Google Sheet| SheetExt["Google Sheets Extractor"]
        Dispatcher -->|Google Doc| DocExt["Google Docs Extractor"]
        Dispatcher -->|Web Article| WebExt["Cheerio Web Extractor"]
        Dispatcher -->|PDF File| PdfExt["pdf-parse Extractor"]
        SheetExt & DocExt & WebExt & PdfExt --> NormalizedLines["Clean string[] Lines"]
    end

    subgraph LLMTiers["Tiered LLM Parsing"]
        NormalizedLines --> TierCheck{"Lines <= 350?"}
        TierCheck -- Yes --> GeminiSingle["Gemini Flash (Single-Shot 32k Buffer)"]
        TierCheck -- No --> GeminiChunks["Gemini Flash (150-Line Chunks)"]
        GeminiSingle & GeminiChunks -->|Error / 429 Limit| GroqFallback["Groq Fallback (7-Line Chunks, 8s Backoff)"]
        GeminiSingle & GeminiChunks & GroqFallback --> RawProblems["Structured Problem Candidates"]
    end

    subgraph IdentityResolution["Canonical Identity Resolution"]
        RawProblems --> SlugGen["Generate Canonical Slugs (kebab-case)"]
        SlugGen --> BatchMatch["Query DB: WHERE canonical_slug IN (...)"]
        BatchMatch --> Partition{"Partition Problems"}
        Partition -->|New Slugs| BulkInsert["createMany into problems"]
        Partition -->|Existing Slugs| Reuse["Reuse existing problem_id"]
        BulkInsert & Reuse --> CreateJunction["createMany into roadmap_problems"]
        CreateJunction --> Finish["200 OK (Roadmap Ready)"]
    end
```

---

### 2. LeetCode Submission, AI Annotation & GitHub Sync

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (LeetCode)
    participant Ext as Browser Extension (cos-leet)
    participant API as Backend API Gateway
    participant Redis as Redis (Dedupe & Queues)
    participant W_Sub as Submission Worker
    participant W_Gh as GitHub Sync Worker
    participant Gemini as Gemini AI
    participant DB as PostgreSQL
    participant GitHub as GitHub API

    Dev->>Dev: Hits "Submit" on LeetCode (Verdict: Accepted)
    Ext->>API: POST /api/v1/submissions (x-api-key)
    API->>Redis: SET sub:dedupe:{userId}:{slug}:{hash} EX 15 NX
    alt Duplicate within 15s
        API-->>Ext: 200 OK (deduplicated)
    else First Ingestion
        API->>Redis: Enqueue submissionQueue
        API-->>Ext: 202 Accepted (queued)
    end

    Redis->>W_Sub: Consume Submission Job
    W_Sub->>DB: Upsert Canonical Problem by slug
    W_Sub->>DB: Evaluate 3-Case Decision Matrix
    alt Identical Code (Case B)
        W_Sub->>DB: Touch updatedAt timestamp (Skip LLM & GitHub)
    else New Solve or Updated Code (Case A & C)
        W_Sub->>DB: Persist ProgressEvent (SOLVED) & Submission (PENDING)
        W_Sub->>Redis: Enqueue githubSyncQueue (Deterministic Job ID)
    end

    Redis->>W_Gh: Consume GitHub Sync Job
    Note over W_Gh,DB: STAGE 1: AI Evaluation Checkpoint
    W_Gh->>Gemini: Generate Annotated Code & Revision Notes
    Gemini-->>W_Gh: Structured JSON Analysis
    W_Gh->>DB: Checkpoint: Save ai_notes & annotated_code (llmStatus: COMPLETED)

    Note over W_Gh,GitHub: STAGE 2: GitHub Repository Push
    W_Gh->>GitHub: PUT /repos/{owner}/{repo}/contents/solutions/{diff}/{slug}/solution.{ext}
    alt SHA Conflict (409 / 422)
        W_Gh->>GitHub: Fetch latest file SHA & retry PUT
    end
    W_Gh->>GitHub: PUT /repos/{owner}/{repo}/contents/solutions/{diff}/{slug}/README.md
    W_Gh->>DB: Finalize githubSyncStatus: SYNCED (Save commitSha)
```

---

### 3. Enterprise Authentication & Session Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant AuthCtrl as Auth Controller
    participant AuthService as Auth Service
    participant Redis as Redis (OTP Store)
    participant EmailWorker as Email Worker
    participant DB as PostgreSQL

    Client->>AuthCtrl: POST /api/v1/auth/register { email, password, name }
    AuthCtrl->>AuthService: registerUser()
    AuthService->>DB: Check duplicate email & Create User (isEmailVerified: false)
    AuthService->>Redis: Store 6-digit OTP (15-min TTL) & Set 60s cooldown lock
    AuthService->>EmailWorker: Enqueue send-verification-email
    AuthCtrl-->>Client: 201 Created (Verification required)

    Client->>AuthCtrl: POST /api/v1/auth/verify-email { email, code }
    AuthCtrl->>AuthService: verifyEmail()
    AuthService->>Redis: Verify OTP & check attempts (< 5)
    AuthService->>DB: Mark is_email_verified = true
    AuthService->>Redis: DEL otp:email_verify:{email}
    AuthService->>AuthService: Issue Access Token (JWT 15m) & Refresh Token (Opaque 40-byte)
    AuthService->>DB: Save SHA-256 hashed refresh token in sessions
    AuthCtrl-->>Client: 200 OK (Auto-Login via Set-Cookie)

    Note over Client,DB: Refresh Token Rotation & Reuse Defense
    Client->>AuthCtrl: POST /api/v1/auth/refresh (Cookie: refresh_token)
    AuthCtrl->>AuthService: rotateRefreshToken()
    AuthService->>DB: Lookup session by SHA-256(refresh_token)
    alt Token already revoked (Reuse Attack Detected!)
        AuthService->>DB: Revoke ALL sessions matching token_family
        AuthCtrl-->>Client: 401 Unauthorized (Session terminated)
    else Token valid
        AuthService->>DB: Mark current session revoked = true
        AuthService->>DB: Insert new session (same token_family, new hashed_token)
        AuthCtrl-->>Client: 200 OK (Set-Cookie updated tokens)
    end
```

---

## 🗄 Database Architecture & ERD

The database schema is strictly maintained in [`database/schema.dbml`](file:///e:/DevProjects/COS/database/schema.dbml) and applied using Prisma 7.

```mermaid
erDiagram
    users ||--o{ api_keys : owns
    users ||--o| github_configs : configures
    users ||--o{ sessions : maintains
    users ||--o{ roadmaps : creates
    users ||--o{ progress_events : records
    users ||--o{ submissions : submits

    roadmaps ||--o{ roadmap_problems : links
    problems ||--o{ roadmap_problems : referenced_in
    problems ||--o{ progress_events : tracks
    problems ||--o{ submissions : receives

    progress_events ||--o| submissions : attaches

    users {
        uuid id PK
        varchar email UK
        varchar name
        varchar password_hash
        boolean is_email_verified
        timestamp email_verified_at
        timestamp created_at
        timestamp updated_at
    }

    api_keys {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar key_hash UK
        varchar key_prefix
        timestamp last_used_at
        timestamp expires_at
        timestamp revoked_at
    }

    github_configs {
        uuid id PK
        uuid user_id FK "1:1"
        varchar github_username
        varchar github_repo
        varchar github_branch
        text access_token_encrypted "AES-256-GCM"
        boolean is_configured
        timestamp last_synced_at
    }

    roadmaps {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar source_type
        text source_url
        RoadmapStatus status
        text error_message
        timestamp created_at
    }

    problems {
        uuid id PK
        varchar canonical_slug UK
        varchar title
        Difficulty difficulty
        varchar platform
        text external_url
        varchar platform_problem_id
    }

    roadmap_problems {
        uuid id PK
        uuid roadmap_id FK
        uuid problem_id FK
        varchar topic
        varchar original_title
        text original_url
        Difficulty original_difficulty
        int order_index
    }

    progress_events {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        ProgressStatus status
        text ai_notes
        timestamp solved_at
    }

    submissions {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        uuid progress_event_id FK "1:1"
        text code
        varchar code_hash
        varchar language
        LlmStatus llm_status
        text annotated_code
        varchar time_complexity
        varchar space_complexity
        GithubSyncStatus github_sync_status
        varchar github_repo
        varchar github_file_path
        varchar github_commit_sha
    }

    sessions {
        uuid id PK
        uuid user_id FK
        varchar token_family
        varchar hashed_token UK
        boolean revoked
        timestamp expires_at
    }
```

---

## 📂 Repository Structure

```
Career-OS/
├── AGENTS.md                          # Global engineering rules & source-of-truth guidelines
├── README.md                          # Primary project documentation
├── package.json                       # Monorepo root scripts
│
├── database/
│   └── schema.dbml                    # Primary database design source of truth (DBML ERD)
│
├── docs/                              # Technical specifications & ADRs
│   ├── architecture/
│   │   ├── overview.md                # System overview
│   │   ├── backend.md                 # Layered backend conventions & pipeline
│   │   ├── frontend.md                # Next.js 16 domain architecture & UX specs
│   │   ├── event-driven.md            # BullMQ queues, event bus, and workers
│   │   └── database.md                # PostgreSQL schema rules & constraints
│   ├── flows/
│   │   ├── auth.md                    # Authentication & token rotation details
│   │   ├── roadmap-ingestion.md       # Ingestion & identity resolution flow
│   │   ├── url-ingestion.md           # Web, Sheets, and Docs extraction
│   │   ├── pdf-ingestion.md           # Multi-page PDF extraction
│   │   └── roadmap-processing.md      # Sliding window chunking & normalization
│   ├── decisions/
│   │   └── ADR-001-database.md        # Database selection record
│   └── product/
│       ├── vision.md                  # Product tenets & philosophy
│       └── features.md                # Feature specifications & roadmap
│
├── backend/                           # Node.js / Express 5 / TypeScript Service
│   ├── prisma/
│   │   ├── schema.prisma              # Prisma ORM models
│   │   └── migrations/                # Version-controlled SQL migrations
│   ├── src/
│   │   ├── app.ts                     # Express app setup & middleware pipeline
│   │   ├── server.ts                  # Server entrypoint & graceful shutdown
│   │   ├── config/                    # Config modules (env.ts, db.ts, redis.ts)
│   │   ├── controllers/               # HTTP controllers (auth, ingest, roadmaps, etc.)
│   │   ├── middleware/                # Auth guards, Zod validation, rate limiters
│   │   ├── queues/                    # BullMQ queue producers (email, ingest, submissions)
│   │   ├── repositories/              # Prisma data access layer (DAO)
│   │   ├── routes/                    # Versioned REST API routing (/api/v1)
│   │   ├── schemas/                   # Zod request & LLM output schemas
│   │   ├── services/                  # Business logic services
│   │   │   ├── extractors/            # Source extractors (PDF, Sheets, Docs, Web)
│   │   │   ├── ingestion/             # Pipeline orchestrator & LLM parser
│   │   │   ├── otp/                   # Ephemeral Redis OTP service
│   │   │   ├── auth.service.ts        # Identity & session management
│   │   │   ├── submission.service.ts  # Submission handling & 3-case matrix
│   │   │   └── githubSync.service.ts  # Checkpointed AI annotation & GitHub push
│   │   ├── utils/                     # Cryptography, tokens, logger, slug generator
│   │   └── workers/                   # BullMQ background workers runner
│   └── tests/                         # Vitest unit & integration test suites
│
└── frontend/                          # Next.js 16 (React 19) Web Application
    ├── src/
    │   ├── app/                       # Next.js App Router (Layouts & Pages)
    │   ├── core/                      # Cross-cutting primitives & layouts
    │   │   ├── components/            # UI components (Button, Modal, Badge, etc.)
    │   │   ├── hooks/                 # Shared hooks (useTheme, useDebounce, etc.)
    │   │   ├── lib/                   # API client instance & class utilities
    │   │   └── providers/             # Theme & React context providers
    │   └── features/                  # Domain modules mirroring backend capabilities
    │       ├── auth/                  # Authentication forms, verification, & session hooks
    │       ├── ingest/                # URL & PDF roadmap import modals
    │       ├── roadmaps/              # Roadmap interactive trees & progress bars
    │       ├── submissions/           # Submissions history & annotated code viewer
    │       ├── problems/              # Problem catalogs, difficulty filters, status toggles
    │       ├── settings/              # API key generation & GitHub configuration
    │       └── landing/               # Interactive 7-step user journey showcase
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `>= 18.x` (Recommended: `>= 20.x`)
- **PostgreSQL**: `>= 14`
- **Redis**: `>= 6` (for BullMQ queues, rate limits, and OTP storage)
- **API Keys**:
  - [Google AI Studio](https://aistudio.google.com/) (`GEMINI_API_KEY` or `GOOGLE_API_KEY`)
  - [Groq Console](https://console.groq.com/) (`GROQ_API_KEY`)
  - [Resend](https://resend.com/) (Optional for production email; falls back to console logger in dev)

---

### Step-by-Step Installation

#### 1. Clone Repository & Install Root Dependencies
```bash
git clone https://github.com/your-username/Career-OS.git
cd Career-OS

# Install backend dependencies
npm run install:backend

# Install frontend dependencies
npm run install:frontend
```

#### 2. Configure Environment Variables
Copy `.env.example` into `backend/.env` and adjust the variables:
```bash
cp .env.example backend/.env
```
*(Refer to [Environment Configuration](#-environment-configuration) below for a detailed breakdown.)*

#### 3. Run Database Migrations
Initialize your PostgreSQL database and execute Prisma migrations:
```bash
cd backend
npx prisma migrate dev
```

#### 4. Start the Backend API Server
In a dedicated terminal:
```bash
# From workspace root
npm run dev:backend
# API will run on http://localhost:3000
```

#### 5. Start the Background Worker Pool
In a second terminal:
```bash
cd backend
npm run worker
# Consumes email, ingestion, submission, and GitHub sync queues
```

#### 6. Start the Frontend Application
In a third terminal:
```bash
# From workspace root
npm run dev:frontend
# Client will be live on http://localhost:3001 (or 3000 if backend is mapped to another port)
```

---

## ⚙ Environment Configuration

Create a `.env` file inside `backend/` with the following variables:

```ini
# ==============================================================================
# Server & Environment
# ==============================================================================
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# ==============================================================================
# PostgreSQL Database (Prisma 7)
# ==============================================================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/career_os?schema=public"

# ==============================================================================
# Redis (BullMQ Queues, Rate Limiting & Ephemeral OTP)
# ==============================================================================
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_URL=redis://127.0.0.1:6379

# ==============================================================================
# LLM Providers (Ingestion & Code Annotation)
# ==============================================================================
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# ==============================================================================
# Security & Cryptography
# ==============================================================================
ACCESS_TOKEN_SECRET=your_super_secret_jwt_access_key
COOKIE_SECRET=your_secure_cookie_signing_secret
ENCRYPTION_KEY=32_byte_hex_key_for_encrypting_github_pats

# ==============================================================================
# Transactional Emails (Resend)
# ==============================================================================
RESEND_API_KEY=re_your_resend_key_here
EMAIL_FROM="Career OS <onboarding@resend.dev>"
```

---

## 🧪 Testing

Automated test suites are configured using **Vitest** for unit and integration testing.

```bash
# Run all backend tests
npm run test:backend

# Run tests in watch mode
cd backend && npm run test:watch
```

Test coverage includes:
- **`auth.test.ts`**: Argon2id password hashing, Redis OTP lifecycle, verification, auto-login, refresh token rotation, and token reuse attack defense.
- **`ingest.test.ts`**: PDF parsing, web scraping, sliding-window chunking, and LLM JSON output validation.
- **`phase5.test.ts`**: Canonical slug generation, URL normalization, and batch cross-roadmap deduplication.

---

## 📜 Development Guidelines

When contributing to Career OS, adhere strictly to the directives outlined in [`AGENTS.md`](file:///e:/DevProjects/COS/AGENTS.md):
1. **Source of Truth Hierarchy**:
   - `Existing Code` $\rightarrow$ `database/schema.dbml` $\rightarrow$ `/docs` $\rightarrow$ `AGENTS.md`.
2. **Layered Architecture**:
   - Controllers must remain thin. Never place business logic, raw SQL, or prompt strings inside route handlers.
   - Enforce: `Controller → Service → Repository → Database`.
3. **Database Changes**:
   - Any schema modification requires updating `database/schema.dbml` **first**, followed by updating `backend/prisma/schema.prisma` and generating a migration.
4. **UI Design Language**:
   - Deliver a sleek, distraction-free SaaS experience inspired by Linear and Raycast.
   - Respect light and dark themes, provide five complete view states (Loading, Empty, Error, Success, Active), and maintain responsive keyboard accessibility.

---

<div align="center">
  <sub>Built with precision for software engineers who want to build momentum and become undeniable.</sub>
</div>

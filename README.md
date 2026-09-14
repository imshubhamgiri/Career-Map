# Career OS

> Personal Career Operating System — Import roadmaps, organize goals, track DSA progress, and accelerate your engineering career.

Career OS is designed as a focused, high-leverage workspace for software engineers. Unlike generic admin dashboards, it delivers a sleek, keyboard-friendly, linear-style experience for importing unstructured learning materials (Google Docs, Google Sheets, PDFs, DSA blogs) and turning them into actionable, progress-tracked curricula.

---

## Repository Structure

```
Career-OS/
│
├── AGENTS.md                    # Global engineering & agent rules
│
├── docs/                        # Architecture & product knowledge base
│   ├── architecture/
│   │   ├── overview.md          # High-level architecture
│   │   ├── backend.md           # Backend layer conventions & pipeline
│   │   ├── frontend.md          # Frontend UX/UI guidelines & design system
│   │   ├── event-driven.md      # Background workers & asynchronous events
│   │   └── database.md          # PostgreSQL database model & rules
│   │
│   ├── flows/
│   │   ├── auth.md              # Identity & session management
│   │   ├── roadmap-ingestion.md # Ingestion pipeline end-to-end
│   │   ├── url-ingestion.md     # Web, Sheets, and Docs extraction
│   │   ├── pdf-ingestion.md     # Multi-page PDF extraction
│   │   └── roadmap-processing.md# Normalization, chunking, deduplication
│   │
│   ├── decisions/
│   │   └── ADR-001-database.md  # Architecture decision record for database
│   │
│   └── product/
│       ├── vision.md            # Product philosophy & UX principles
│       └── features.md          # Current & upcoming feature roadmap
│
├── database/
│   └── schema.dbml              # Source of truth for database design & ERD
│
├── .github/
│   ├── instructions/
│   │   ├── backend.instructions.md   # Backend coding directives
│   │   ├── frontend.instructions.md  # Frontend design system directives
│   │   └── database.instructions.md  # Database migration & schema rules
│   │
│   └── agents/
│       ├── planner.agent.md     # Planner agent persona & system prompt
│       └── reviewer.agent.md    # Reviewer agent persona & system prompt
│
├── backend/                     # Node.js / Express / TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma ORM schema
│   │   └── migrations/          # Version-controlled migrations
│   └── src/                     # Core controllers, services, extractors
│
├── frontend/                    # Modern React / Next.js web application
│
├── README.md
├── .env.example
└── package.json
```

---

## Core Capabilities

- **Multi-Source Ingestion**: Ingest roadmaps from Google Sheets, Google Docs, PDFs, and generic web articles.
- **Intelligent LLM Parsing**: Multi-pass chunking with structured JSON extraction (topics, problem titles, difficulty levels, reference URLs, canonical slugs).
- **Curriculum & DSA Tracking**: Track problem-solving state (`SOLVED`, `ATTEMPTED`, `REVISE`), notes, and timestamps.
- **Relational Integrity**: PostgreSQL with strict foreign keys, cascading deletions, and canonical problem mapping.
- **Premium UX**: Linear / Raycast-inspired interface supporting full Light and Dark modes.

---

## Quickstart

### Prerequisites

- **Node.js**: >= 18.x
- **PostgreSQL**: >= 14
- **API Keys**: Groq API Key and/or Google AI Studio API Key (for LLM ingestion pipeline)

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Career-OS
   ```

2. **Environment Variables**:
   Copy `.env.example` into `backend/.env` and fill in the required keys:
   ```bash
   cp .env.example backend/.env
   ```

3. **Install Dependencies**:
   ```bash
   # In root (or cd backend && npm install)
   npm run install:backend
   ```

4. **Run the Backend**:
   ```bash
   npm run dev:backend
   ```
   The backend API will be live on `http://localhost:3000`.

---

## Development Guidelines

- Always review `AGENTS.md` before making architectural or code changes.
- Database source of truth is strictly `database/schema.dbml`.
- Domain documentation and flows are maintained in `docs/`.


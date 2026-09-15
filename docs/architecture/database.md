# Database Architecture

## Overview

Career OS utilizes **PostgreSQL** as its primary persistent relational data store.

The strict source of truth for the database design and Entity-Relationship Diagram (ERD) is:
```
database/schema.dbml
```

## Entity Relationship Model

```mermaid
erDiagram
    users ||--o{ roadmaps : owns
    users ||--o{ progress_events : records
    roadmaps ||--o{ problems : contains
    problems ||--o{ progress_events : tracks

    users {
        uuid id PK
        varchar email UK
        varchar name
        varchar password_hash
        timestamp created_at
        timestamp updated_at
    }

    roadmaps {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar source_type
        text source_url
        varchar status
        text error_message
        timestamp created_at
        timestamp updated_at
    }

    problems {
        uuid id PK
        uuid roadmap_id FK
        varchar title
        varchar topic
        varchar difficulty
        text external_url
        varchar canonical_slug
        timestamp created_at
    }

    progress_events {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        varchar status
        text notes
        timestamp completed_at
    }
```

## Relational Constraints & Rules

1. **Ownership & Cascades**:
   - `roadmaps.user_id` references `users.id` with `ON DELETE CASCADE`.
   - `problems.roadmap_id` references `roadmaps.id` with `ON DELETE CASCADE`.
   - `progress_events` reference both `users.id` and `problems.id` with `ON DELETE CASCADE`.

2. **Identifiers**:
   - All primary keys use UUIDs generated via `gen_random_uuid()`.

3. **Canonical Slugs**:
   - `problems.canonical_slug` provides a normalized identifier (e.g. `two-sum`, `lru-cache`) to cross-reference problems across multiple roadmaps or link with external platforms like LeetCode.

4. **Progress States**:
   - `progress_events.status` values:
     - `SOLVED`: Problem successfully completed.
     - `ATTEMPTED`: Problem attempted but not yet fully solved.
     - `REVISE`: Problem flagged for spaced repetition / review.

## Roadmap Ingestion & Deduplication ("Clone-on-Ingest")

To prevent redundant LLM extraction costs when multiple users import the same source URL (e.g. popular sheets), the database serves as an extraction cache while strictly preserving individual user ownership:

1. **Check Existing Source**:
   Query `roadmaps` for an existing completed extraction:
   ```sql
   SELECT id FROM roadmaps WHERE source_url = :url AND status = 'COMPLETED' LIMIT 1;
   ```
2. **Atomic Clone**:
   If an existing roadmap $R_1$ exists and `forceRefresh` is not set:
   ```sql
   -- 1. Create a distinct roadmap row for User B
   INSERT INTO roadmaps (id, user_id, title, source_type, source_url, status)
   VALUES (gen_random_uuid(), :userBId, :title, :sourceType, :sourceUrl, 'COMPLETED')
   RETURNING id; -- Returns $newRoadmapId

   -- 2. Fast atomic clone of all problems into User B's roadmap
   INSERT INTO problems (id, roadmap_id, title, topic, difficulty, external_url, canonical_slug)
   SELECT gen_random_uuid(), :newRoadmapId, title, topic, difficulty, external_url, canonical_slug
   FROM problems
   WHERE roadmap_id = :existingRoadmapId;
   ```
3. **Consequence**:
   - User B owns an isolated copy of the roadmap and problems.
   - User B's `progress_events` reference their own unique `problems.id`.
   - Ingestion executes in $\sim 5\text{ms}$ with 0 LLM tokens burned.

## Migration & ORM Runtime (Prisma ORM v7)

1. **Schema & Config**:
   - `database/schema.dbml` defines the schema design.
   - `backend/prisma/schema.prisma` defines the Prisma models (datasource URLs are omitted per Prisma 7 standards).
   - `backend/prisma.config.ts` configures the migration and shadow database connection URLs for Prisma CLI.
2. **Driver Adapter Runtime**:
   - Prisma Client runtime utilizes `@prisma/adapter-pg` with a pooled `pg` client connection.
   - Centralized singleton client is exported from `backend/src/config/db.ts`.
3. **Running Migrations**:
   - Run `npx prisma migrate dev --name <migration_name>` inside `backend/`.
   - Commit the generated SQL migrations in `backend/prisma/migrations/`.




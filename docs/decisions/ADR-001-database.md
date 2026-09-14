# ADR-001: Selection of PostgreSQL, Prisma, and DBML Source of Truth

## Status
**Accepted**

## Context
Career OS requires persistent storage for hierarchical and relational data:
- User accounts and authentication credentials.
- Roadmaps imported from diverse external sources.
- Coding problems assigned to specific roadmaps and topics.
- Event logs tracking user progress, attempts, and revisions over time.

We need a database solution that guarantees referential integrity (e.g. cascading deletes when a user or roadmap is deleted), supports rich indexing for fast cross-roadmap queries, and provides seamless TypeScript integration for developers.

## Decision
1. **Primary Database**: We adopt **PostgreSQL** as the primary relational database.
2. **Data Access & Migrations**: We adopt **Prisma** as the ORM and migration engine for the Node.js / TypeScript backend.
3. **Design Source of Truth**: We establish `database/schema.dbml` as the single source of truth for schema design, entity relationships, and architectural documentation.

## Consequences

### Positive
- **Referential Integrity**: Robust foreign keys with `ON DELETE CASCADE` prevent orphaned problem or progress records.
- **Type Safety**: Prisma generates precise TypeScript definitions derived directly from the database schema.
- **Visual Clarity**: `schema.dbml` provides a human-readable and tool-friendly ERD format independent of any specific ORM syntax.
- **Ecosystem Maturity**: PostgreSQL offers advanced JSONB capabilities and indexing (B-Tree, GIN) for future search features.

### Negative / Trade-offs
- Schema changes require a disciplined 2-step process: updating `database/schema.dbml` first, then updating `backend/prisma/schema.prisma` and running migrations.
- Running migrations requires a running PostgreSQL instance in development.


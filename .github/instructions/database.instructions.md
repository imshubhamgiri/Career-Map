# Database Instructions

## Source of Truth

The database architecture source of truth is strictly:
```
database/schema.dbml
```

Never invent database relationships or change column definitions without referencing or updating this file first.

## Rules for Schema Modifications

If a feature requires a database change:

1. **Rationale**: Document the clear business need for the change.
2. **Update DBML**: Modify `database/schema.dbml` to reflect new tables, columns, indexes, or relationships.
3. **Prisma Schema**: Synchronize `backend/prisma/schema.prisma`.
4. **Migration**: Generate and verify the migration inside `backend/prisma/migrations/`.
5. **Backend Models**: Update TypeScript interfaces and repositories in `backend/src/`.
6. **Documentation**: Update `docs/architecture/database.md`.

## Relational Constraints

- Primary keys are UUIDs (`gen_random_uuid()`).
- All foreign keys referencing parent entities (e.g. `user_id`, `roadmap_id`) must have explicit cascading rules (`[delete: cascade]`).
- Store timestamps with timezone (`created_at`, `updated_at`, `completed_at`).
- Keep status flags strictly enumerated (e.g., `progress_events.status` in `SOLVED`, `ATTEMPTED`, `REVISE`).


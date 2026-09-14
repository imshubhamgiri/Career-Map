# Career OS — Agent Instructions

## 1. Project

Career OS is a personal Career Operating System.

The application helps users:

- import career roadmaps
- organize learning goals
- track roadmap progress
- track DSA/problem-solving progress
- manage career resources
- eventually connect external services such as GitHub, LeetCode,
  Google Drive and other productivity tools

The product should feel like a serious premium SaaS product,
not a generic admin dashboard.

---

## 2. Before changing code

Before implementing a non-trivial feature:

1. Inspect the existing implementation.
2. Read the relevant documentation in `/docs`.
3. Check `database/schema.dbml` if the feature involves data.
4. Check existing components before creating new ones.
5. Follow the existing architecture.
6. Do not rewrite working systems unnecessarily.

If requirements are ambiguous, make the smallest reasonable assumption
and document it rather than inventing a large architecture.

---

## 3. Source of truth

Use these sources in this order:

1. Existing code
2. `database/schema.dbml`
3. `/docs`
4. Figma design
5. This file

Do not invent database relationships when the schema already defines them.

If the implementation requires a schema change:

1. Explain why.
2. Update `schema.dbml`.
3. Create/update the migration.
4. Update affected backend code.
5. Update relevant documentation.

---

## 4. Architecture

Follow the existing project architecture.

Backend business logic should follow:

Controller
    ↓
Service
    ↓
Repository
    ↓
Database

Controllers should remain thin.

Do not put business logic directly inside route handlers.

Frontend should separate:

- pages/routes
- UI components
- feature components
- API/data access
- state management

Prefer reusable components over duplicated UI.

---

## 5. Database

`database/schema.dbml` is the database design source of truth.

Before modifying database-related code:

- inspect the schema
- understand relationships
- check existing migrations
- preserve existing constraints

Never silently change the schema because it makes implementation easier.

---

## 6. UI / UX

Career OS has two themes:

- Light
- Dark

Design language:

- premium
- minimal
- sophisticated
- spacious
- modern SaaS
- Linear / Vercel / Raycast inspired

Avoid:

- generic dashboard templates
- excessive cards
- excessive borders
- excessive gradients
- neon/cyberpunk styling
- unnecessary glassmorphism
- huge shadows

Use gradients primarily as brand accents:

indigo → violet → cyan

Every new UI feature must consider:

- light mode
- dark mode
- loading state
- empty state
- error state
- success state
- responsive layout
- accessibility

---

## 7. Code quality

Prefer:

- TypeScript
- strong typing
- small focused functions
- explicit error handling
- reusable components
- meaningful names

Avoid:

- `any` unless genuinely necessary
- duplicated logic
- giant components
- unnecessary abstractions
- premature optimization

Do not introduce a new library when existing project dependencies
already solve the problem.

---

## 8. Security

Never expose:

- API keys
- secrets
- database credentials
- OAuth client secrets
- private tokens

Use environment variables.

Validate external input.

Treat imported URLs, documents and third-party content as untrusted.

---

## 9. Testing

For meaningful backend logic:

- add unit tests where appropriate
- test validation
- test failure paths
- test important business rules

For UI features:

- verify responsive behavior
- verify both themes
- verify loading/error/empty states

---

## 10. Agent behavior

Do not make large unrelated changes.

Before modifying many files, explain the plan.

After implementation:

1. summarize changed files
2. explain important decisions
3. mention tests/checks performed
4. mention anything intentionally left incomplete

Never claim something works without verifying it.


## Architectural changes

Before introducing:

- a new database
- a new queue
- a new message broker
- a new framework
- a new external service
- a new architectural pattern

first inspect existing architecture documentation.

For significant architectural changes:

1. explain the problem
2. propose the change
3. identify affected components
4. update the relevant ADR
5. then implement
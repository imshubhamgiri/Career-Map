# Backend Development Instructions

## Architectural Pattern

Follow the strict layered architecture:

```
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

### 1. Controllers
- Keep controllers thin. They should parse input, call the relevant service, and format the HTTP response.
- Never write business logic, database queries, or LLM prompt formatting inside route handlers or controllers.
- Delegate all errors to the next middleware (`next(err)`).

### 2. Services
- Contain pure business logic and orchestration.
- Services should be modular and independently testable.
- For ingestion: separate extraction (normalizing source to `string[]`), chunking, LLM parsing, and database persistence.

### 3. Error Handling
- Use the standard `AppError` class with appropriate HTTP status codes (e.g., 400 for bad input, 404 for missing resources, 422 for unprocessable content).
- Do not let unhandled promise rejections escape.
- Central error handler (`src/errors/errorHandler.ts`) formats responses consistently.

### 4. Logging
- Use Pino logger (`src/utils/logger.ts`).
- Avoid `console.log` or `console.error` in production paths.
- Attach contextual metadata (e.g. `service`, `userId`, `chunkCount`) to log calls.

### 5. Validation
- Validate all incoming request bodies, query params, and route parameters with Zod schemas via `validateBody` / `validateQuery` middleware.

### 6. Security
- Never log or expose API keys, bearer tokens, or database credentials.
- Treat external URLs and uploaded documents as untrusted input.


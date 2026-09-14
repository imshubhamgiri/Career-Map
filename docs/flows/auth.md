# Authentication & Identity Flow

## Overview

Career OS supports both credential-based (email + password) and OAuth 2.0 authentication flows (GitHub, Google).

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant AuthCtrl as Auth Controller
    participant AuthService as Auth Service
    participant DB as PostgreSQL
    participant OAuth as OAuth Provider (GitHub/Google)

    alt Credential Login
        User->>AuthCtrl: POST /api/v1/auth/login { email, password }
        AuthCtrl->>AuthService: validateCredentials(email, password)
        AuthService->>DB: findUserByEmail(email)
        DB-->>AuthService: userRecord (with password_hash)
        AuthService->>AuthService: bcrypt.compare(password, password_hash)
        AuthService-->>AuthCtrl: { token, user }
        AuthCtrl-->>User: 200 OK (Set-Cookie: jwt / JSON token)
    else OAuth Login
        User->>AuthCtrl: GET /api/v1/auth/oauth/:provider
        AuthCtrl-->>User: 302 Redirect to OAuth Provider
        User->>OAuth: Authorize Application
        OAuth-->>AuthCtrl: Callback with Authorization Code
        AuthCtrl->>AuthService: exchangeCodeAndFetchProfile(code)
        AuthService->>OAuth: POST /token
        OAuth-->>AuthService: Access Token & User Profile
        AuthService->>DB: upsertOAuthUser(profile)
        DB-->>AuthService: userRecord
        AuthCtrl-->>User: 302 Redirect to App with Session Cookie
    end
```

## Security Requirements

1. **Password Hashing**: Passwords must be hashed using `bcrypt` or `argon2` with a minimum cost factor of 12. Never store plaintext passwords.
2. **Tokens**: JWTs should be signed with strong secrets (`JWT_SECRET`) and carry a short expiration (e.g., 15-60 minutes).
3. **Session Transport**: Prefer `HttpOnly`, `Secure`, `SameSite=Lax` cookies to prevent XSS credential theft.
4. **OAuth User Records**: OAuth users have `password_hash = NULL` in `users` table.


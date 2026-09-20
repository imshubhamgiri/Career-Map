# Authentication & Identity Flow

## Overview

Career OS supports credential-based (email + password) and OAuth 2.0 authentication flows (GitHub, Google) with a dual-token session architecture:
- **Access Token**: Short-lived JWT (15 minutes) for stateless authentication.
- **Refresh Token**: Long-lived opaque token (7 days) stored hashed in PostgreSQL with single-use rotation and token family reuse detection.

---

## 1. Credential Login & Session Creation

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant AuthCtrl as Auth Controller
    participant AuthService as Auth Service
    participant UserRepo as User Repository
    participant DB as PostgreSQL

    User->>AuthCtrl: POST /api/v1/auth/login { email, password }
    AuthCtrl->>AuthService: loginUser(email, password)
    AuthService->>UserRepo: findUserByEmail(email)
    UserRepo->>DB: SELECT * FROM users WHERE email = :email
    DB-->>UserRepo: userRecord
    UserRepo-->>AuthService: userRecord (with passwordHash)
    AuthService->>AuthService: verifyPassword(passwordHash, password) [Argon2id]
    
    AuthService->>AuthService: generateAccessToken(user) [JWT: 15m]
    AuthService->>AuthService: generateOpaqueToken() [40-byte random hex]
    AuthService->>AuthService: hashOpaqueToken(token) [SHA-256]
    AuthService->>UserRepo: createSession({ userId, tokenFamily, hashedToken, expiresAt })
    UserRepo->>DB: INSERT INTO sessions (...)
    DB-->>UserRepo: sessionRecord
    UserRepo-->>AuthService: sessionRecord
    
    AuthService-->>AuthCtrl: { user, accessToken, refreshToken }
    AuthCtrl->>AuthCtrl: setTokenCookies(res, accessToken, refreshToken)
    AuthCtrl-->>User: 200 OK (Set-Cookie: access_token, refresh_token)
```

---

## 2. Refresh Token Rotation & Reuse Detection

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / Browser
    participant AuthCtrl as Auth Controller
    participant AuthService as Auth Service
    participant UserRepo as User Repository
    participant DB as PostgreSQL

    Client->>AuthCtrl: POST /api/v1/auth/refresh (Cookie: signed refresh_token)
    AuthCtrl->>AuthService: rotateRefreshToken(rawRefreshToken)
    AuthService->>AuthService: hashOpaqueToken(rawRefreshToken) [SHA-256]
    AuthService->>UserRepo: findSessionByHashedToken(hashedToken)
    UserRepo->>DB: SELECT * FROM sessions WHERE hashed_token = :hash
    DB-->>UserRepo: sessionRecord

    alt Session Not Found
        AuthService-->>AuthCtrl: 401 Unauthorized (Invalid refresh token)
    else Token Already Revoked (Reuse Attack Detected!)
        AuthService->>UserRepo: revokeAllSessionsForUser(tokenFamily)
        UserRepo->>DB: UPDATE sessions SET revoked = true WHERE token_family = :family
        AuthService-->>AuthCtrl: 401 Unauthorized (Reuse detected - all sessions revoked)
    else Token Expired
        AuthService->>UserRepo: revokeSession(session.id)
        AuthService-->>AuthCtrl: 401 Unauthorized (Token expired)
    else Token Valid
        AuthService->>UserRepo: revokeSession(session.id)
        UserRepo->>DB: UPDATE sessions SET revoked = true WHERE id = :id
        AuthService->>AuthService: generateAccessToken(user)
        AuthService->>AuthService: generateOpaqueToken() & hashOpaqueToken()
        AuthService->>UserRepo: createSession(same tokenFamily, new hashedToken)
        UserRepo->>DB: INSERT INTO sessions (...)
        AuthService-->>AuthCtrl: { newAccessToken, newRefreshToken }
        AuthCtrl->>AuthCtrl: setTokenCookies(res, newAccessToken, newRefreshToken)
        AuthCtrl-->>Client: 200 OK (Set-Cookie: updated tokens)
    end
```

---

## 3. Endpoints Specification

| Method | Endpoint | Auth Required | Request Body / Cookies | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | None | `{ name, email, password }` | `201 Created` + User info (`isEmailVerified: false`) |
| `POST` | `/api/v1/auth/verify-email` | None | `{ email, code }` | `200 OK` + HTTP cookies (Auto-Login!) + User info |
| `POST` | `/api/v1/auth/resend-verification` | None | `{ email }` | `200 OK` + Success message |
| `POST` | `/api/v1/auth/login` | None | `{ email, password }` | `200 OK` + HTTP cookies + User info |
| `POST` | `/api/v1/auth/refresh` | Signed Cookie | Cookie: `refresh_token` | `200 OK` + rotated cookies |
| `POST` | `/api/v1/auth/logout` | Optional | Cookie: `refresh_token` | `200 OK` + cleared cookies |
| `GET` | `/api/v1/auth/me` | Bearer or Cookie | Header / `access_token` cookie | `200 OK` + User profile |

---

## 4. Security Requirements & Standards

1. **Password Hashing**: Passwords are hashed using **Argon2id** (`memoryCost: 65536` [64MB], `timeCost: 3`, `parallelism: 4`). Plaintext passwords are never stored.
2. **Access Tokens**: Signed using `ACCESS_TOKEN_SECRET` with a 15-minute expiration (`expiresIn: '15m'`). Validated via `authenticate` middleware. Accepts both HTTP cookies and `Authorization: Bearer <token>` headers.
3. **Refresh Tokens**: Cryptographically secure 40-byte hex strings. Transferred as **signed** cookies (`COOKIE_SECRET`) with `path: '/api/v1/auth'`.
4. **Database Storage**: Refresh tokens are hashed via SHA-256 (`crypto.createHash('sha256')`) prior to insertion in PostgreSQL `sessions`. Even if the database is compromised, active session tokens cannot be derived.
5. **Token Reuse Defense**: Every refresh operation invalidates the current token. If an attacker attempts to replay an invalidated token, all sessions in that `token_family` are immediately terminated.
6. **Cookie Security**:
   - `httpOnly: true` (prevents JavaScript access / XSS theft)
   - `sameSite: 'strict'` (prevents CSRF token transmission)
   - `secure: true` in production environments



# Career OS — Production Readiness & Implementation Guide

> **Document Scope**: This document is an actionable, highly detailed engineering specification of all remaining tasks, architectural gaps, and production best practices required to transition Career OS from a core prototype into a hardened production product.
>
> It covers the **"why"** behind critical web architecture decisions (especially Next.js, React 19, hydration, security guards, and CSS rendering pipelines) and provides concrete, step-by-step technical blueprints for every unfinished feature.

---

## Table of Contents
1. [Executive Action Matrix & Priority Roadmap](#1-executive-action-matrix--priority-roadmap)
2. [Frontend Deep-Dive: The "Why" of Modern Full-Stack Mechanics](#2-frontend-deep-dive-the-why-of-modern-full-stack-mechanics)
   - [2.1. Next.js App Router: Server Rendering, Hydration, and the "Flash" Gap](#21-nextjs-app-router-server-rendering-hydration-and-the-flash-gap)
   - [2.2. Theme Engine: Why `localStorage` in `useEffect` Causes a 1–2s Delay (FOUC)](#22-theme-engine-why-localstorage-in-useeffect-causes-a-12s-delay-fouc)
   - [2.3. Route Security: Edge Middleware vs. Client Layout Guards](#23-route-security-edge-middleware-vs-client-layout-guards)
   - [2.4. Cookie Scopes & Cross-Origin Auth in Local vs. Production Deployments](#24-cookie-scopes--cross-origin-auth-in-local-vs-production-deployments)
   - [2.5. Optimistic UI Updates: Linear/Raycast UX Without Stale Data](#25-optimistic-ui-updates-linearraycast-ux-without-stale-data)
3. [Detailed Work-Item Technical Specifications](#3-detailed-work-item-technical-specifications)
   - [Work Item 1: Frontend Route Protection (Edge Middleware + Client AuthGuard)](#work-item-1-frontend-route-protection-edge-middleware--client-authguard)
   - [Work Item 2: Zero-Latency Theme Engine (Eliminating FOUC)](#work-item-2-zero-latency-theme-engine-eliminating-fouc)
   - [Work Item 3: Problem Progress Persistence (End-to-End Core Loop)](#work-item-3-problem-progress-persistence-end-to-end-core-loop)
   - [Work Item 4: Workspace Settings API Connection](#work-item-4-workspace-settings-api-connection)
   - [Work Item 5: Prisma Repository Runtime Query Fixes](#work-item-5-prisma-repository-runtime-query-fixes)
   - [Work Item 6: Import Redirection & Curated Roadmaps Seeding](#work-item-6-import-redirection--curated-roadmaps-seeding)
   - [Work Item 7: Redis-Backed Rate Limiting with RFC 6585 Headers](#work-item-7-redis-backed-rate-limiting-with-rfc-6585-headers)
   - [Work Item 8: Environment & Port Alignment](#work-item-8-environment--port-alignment)
4. [Verification & Acceptance Checklist](#4-verification--acceptance-checklist)

---

## 1. Executive Action Matrix & Priority Roadmap

Pick up work items in this exact sequence to unblock the end-to-end user journey without regressions:

| Item | Area | Priority | Target Files | Summary |
| :--- | :--- | :--- | :--- | :--- |
| **WI-1** | Frontend | **P0 (Security)** | `frontend/src/middleware.ts`<br>`frontend/src/app/(dashboard)/layout.tsx`<br>`frontend/src/features/auth/components/auth-guard.tsx` | Lock down dashboard with Edge Middleware + layout AuthGuard with skeleton loading. |
| **WI-2** | Frontend | **P0 (UX)** | `frontend/src/app/layout.tsx`<br>`frontend/src/core/providers/theme-provider.tsx` | Eliminate the 1–2s theme delay via blocking inline `<head>` execution script. |
| **WI-5** | Backend | **P0 (DB Bug)** | `backend/src/repositories/roadmap.repository.ts` | Fix Prisma runtime query crash caused by passing non-unique fields to `findUnique`/`delete`. |
| **WI-3** | Full-Stack | **P1 (Core Flow)** | `backend/src/controllers/progress.controller.ts`<br>`backend/src/routes/v1/progress.routes.ts`<br>`frontend/src/features/roadmaps/components/roadmap.tsx` | Expose `POST /api/v1/problems/:id/progress` and wire optimistic persistence to the problem toggle checkboxes. |
| **WI-4** | Full-Stack | **P1 (Settings)** | `frontend/src/features/settings/services/setting-service.ts`<br>`frontend/src/features/settings/components/settings-page.tsx` | Fix endpoint mismatch (`GET /settings` 404); load existing API keys & GitHub config on mount. |
| **WI-6** | Frontend | **P1 (Import)** | `frontend/src/app/(dashboard)/dashboard/import/page.tsx` | Fix `data.roadmapId` → `data.id` navigation bug so newly created roadmaps load. |
| **WI-7** | Backend | **P2 (Hardening)** | `backend/src/middleware/rateLimit.middleware.ts`<br>`backend/src/routes/v1/auth.routes.ts` | Implement Redis sliding window rate limiting with standard RFC 6585 / IETF headers. |
| **WI-8** | Config | **P2 (DevOps)** | `backend/src/config/env.ts`<br>`backend/.env.example` | Align default port to 5000 to prevent port collisions with Next.js port 3000. |

---

## 2. Frontend Deep-Dive: The "Why" of Modern Full-Stack Mechanics

*This section provides in-depth mental models for backend engineers mastering modern frontend architecture.*

---

### 2.1. Next.js App Router: Server Rendering, Hydration, and the "Flash" Gap

In classic Client-Side Rendered (CSR) Single Page Applications (like plain Vite + React), the browser receives an almost empty HTML file:
```html
<div id="root"></div>
<script src="/bundle.js"></script>
```
The browser shows a blank white page until `bundle.js` downloads, compiles, executes, and builds the DOM.

In **Next.js App Router**, the browser experiences two distinct phases:

```
[Phase 1: Server Render (SSR)]
  Server compiles React tree into raw HTML string.
  Sends raw HTML + CSS immediately to the browser.
  Browser parses HTML and PAINTS UI immediately (Fast First Contentful Paint).
          │
          ▼
[Phase 2: Hydration Gap (1–2 seconds on normal connections)]
  Browser downloads client JS bundles (React, Motion, icons, etc.).
  Browser parses and executes JavaScript chunks.
          │
          ▼
[Phase 3: React Hydration & Effect Execution]
  React attaches event listeners to existing DOM nodes.
  React runs all `useEffect()` hooks.
```

#### The Architectural Catch:
Any state logic placed inside a `useEffect` hook **does not run until Phase 3**. If you rely on `useEffect` for:
1. **Theming (`localStorage`)**: The browser paints Phase 1 with the server default. When Phase 3 arrives 1–2 seconds later, `useEffect` triggers, changes classes, and violently flashes the screen.
2. **Authentication Route Protection**: The browser renders Phase 1 with the protected dashboard markup. An unauthenticated user sees the dashboard shell, sends failed API calls, and only 1.5 seconds later does `useEffect` detect no user and redirect to `/login`.

---

### 2.2. Theme Engine: Why `localStorage` in `useEffect` Causes a 1–2s Delay (FOUC)

#### What Happened in Career OS:
1. In `frontend/src/app/layout.tsx`:
   ```tsx
   <html lang="en" className={cn("dark", "font-sans", geist.variable)} suppressHydrationWarning>
   ```
   The HTML sent over the wire had class `"dark"` hardcoded.
2. In `frontend/src/core/providers/theme-provider.tsx`:
   ```tsx
   const [theme, setThemeState] = useState<Theme>("dark");
   useEffect(() => {
     const saved = localStorage.getItem("cos-theme");
     if (saved === "light") {
       applyTheme("light"); // Removes "dark", adds "light"
     }
   }, []);
   ```
3. In `frontend/src/app/(dashboard)/layout.tsx`:
   ```tsx
   className="... transition-colors duration-200"
   ```

#### The Chain of Events:
- User chose **Light Mode** on a previous visit.
- User opens the site.
- **T = 0ms**: Server delivers HTML with `class="dark"`. The browser parses CSS and paints deep dark charcoal backgrounds.
- **T = 50ms – 1200ms**: The browser downloads JavaScript chunks (`next.js`, `lucide-react`, `motion`, `@base-ui`). The screen remains dark.
- **T = 1200ms**: React hydrates the page. `ThemeProvider`'s `useEffect` executes.
- **T = 1210ms**: `localStorage.getItem("cos-theme")` returns `"light"`. `classList.remove("dark")` executes.
- **T = 1210ms – 1410ms**: Because of `transition-colors duration-200`, the entire screen slowly morphs from dark to light.

This is known as **FOUC (Flash of Unstyled Content / Theme Flicker)**.

#### The Zero-Latency Solution (Blocking Script in `<head>`):
Browsers execute inline `<script>` tags found in `<head>` **synchronously and blocking** before the DOM is rendered or painted to the screen.

```html
<head>
  <script>
    // Runs in < 1 millisecond BEFORE first paint
    (function() {
      try {
        var saved = localStorage.getItem('cos-theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = saved === 'dark' || (!saved && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);
      } catch (e) {}
    })();
  </script>
</head>
```
When this script runs, it mutates `document.documentElement.classList` before the browser layout engine calculates styles. When First Paint occurs, it paints the correct theme immediately. **Zero flicker, zero delay.**

---

### 2.3. Route Security: Edge Middleware vs. Client Layout Guards

Securing routes in modern full-stack web applications requires **defense-in-depth**.

```
Browser Request: GET /dashboard
          │
          ▼
┌──────────────────────────────────────────────┐
│ Layer 1: Next.js Edge Middleware             │
│ (src/middleware.ts)                          │
│                                              │
│ - Runs on V8 Edge runtime                    │
│ - Reads incoming cookies (`access_token`)    │
│ - Zero HTML rendered if unauthenticated      │
│ - Returns HTTP 307 Redirect to /login        │
└──────────────────────┬───────────────────────┘
                       │ (If cookie present)
                       ▼
┌──────────────────────────────────────────────┐
│ Layer 2: Client AuthGuard Component          │
│ (in (dashboard)/layout.tsx)                  │
│                                              │
│ - Checks active session state in React       │
│ - Displays sleek skeleton while initializing │
│ - Verifies user email verification status    │
│ - Prevents rendering private children        │
└──────────────────────────────────────────────┘
```

#### Why Layer 1 (Edge Middleware) is Required:
Without Edge Middleware, the server delivers the HTML shell of `/dashboard` to anyone who asks for it. Search engines index private content, and malicious actors can inspect layout markup. Edge Middleware terminates unauthorized requests before Next.js begins component compilation.

#### Why Layer 2 (Client AuthGuard) is Still Required:
Tokens expire while a user is actively interacting with a tab. If an access token expires or is revoked on another device, Layer 2 catches the expired session during client-side SPA route transitions (which do not always re-trigger server middleware) and handles a graceful redirect.

---

### 2.4. Cookie Scopes & Cross-Origin Auth in Local vs. Production Deployments

In `backend/src/utils/tokens.ts`:
```ts
export function getBaseAccessTokenOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',  
  };
}

export function getBaseRefreshTokenOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    signed: true,
    path: '/api/v1/auth',
  };
}
```

#### Key Considerations for Frontend Engineers:
1. **The `path: '/api/v1/auth'` Restriction**:
   The `refresh_token` cookie is scoped exclusively to `/api/v1/auth`. The browser will **never** send this cookie when requesting `/dashboard` or `/api/v1/roadmaps`. This is a security feature (prevents exfiltration on unrelated endpoints), but it means **Next.js middleware cannot check `refresh_token` on `/dashboard` navigations**. Next.js middleware must check `access_token` or an authenticated session marker cookie.
2. **`sameSite: 'strict'` vs. `'lax'`**:
   With `sameSite: 'strict'`, if a user clicks a link to Career OS from an external email or Discord message, the browser **strips all cookies** on that initial incoming navigation request! The user appears logged out until they reload the page. For production SaaS authentication, **`sameSite: 'lax'`** is standard for web sessions.
3. **Cross-Origin Subdomains in Production**:
   If frontend is hosted on `app.careeros.dev` and backend is hosted on `api.careeros.dev`:
   - Cookies must specify `domain: '.careeros.dev'`.
   - Without the leading dot, browsers will treat `api.careeros.dev` cookies as strictly isolated from `app.careeros.dev`.

---

### 2.5. Optimistic UI Updates: Linear/Raycast UX Without Stale Data

A hallmark of premium SaaS applications (Linear, Raycast, Superhuman) is **zero perceived latency**.

#### The Flawed Approach (Pessimistic):
1. User clicks checkbox on "Two Sum" to mark it SOLVED.
2. Checkbox shows a loading spinner.
3. Network request travels to server (250ms).
4. Server updates DB.
5. Response arrives.
6. Checkbox changes to green checkmark.
*Feel: Sluggish, clunky.*

#### The Optimistic UI Pattern:
1. User clicks checkbox on "Two Sum".
2. **Immediately** flip the UI state to SOLVED in React state (0ms latency).
3. Fire background network request `apiClient.post('/problems/:id/progress', ...)`.
4. If the request succeeds: Do nothing (or update metadata like `solvedAt`).
5. If the request fails:
   - Roll back the checkbox to its previous state.
   - Show an error notification: *"Failed to save progress. Click to retry."*

#### Career OS Current Status:
`RoadmapView` implemented step 2, but completely omitted steps 3, 4, and 5! The state was updated only in local component memory, so refreshing the browser discarded all user progress.

---

## 3. Detailed Work-Item Technical Specifications

---

### Work Item 1: Frontend Route Protection (Edge Middleware + Client AuthGuard)

#### Objective
Prevent unauthenticated users from accessing `/dashboard`, `/dashboard/*`, and `/roadmaps/*`. Redirect logged-in users away from `/login` and `/register`.

#### Step 1: Create Next.js Edge Middleware
Create file: `frontend/src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inspect auth cookies
  const accessToken = request.cookies.get("access_token")?.value;

  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/roadmaps");

  const isAuthPath =
    pathname === "/login" ||
    pathname === "/register";

  // 1. Unauthenticated user trying to access protected route
  if (isProtectedPath && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user trying to access login/register
  if (isAuthPath && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/roadmaps/:path*",
    "/login",
    "/register",
  ],
};
```

#### Step 2: Create Client AuthGuard Component
Create file: `frontend/src/features/auth/components/auth-guard.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  // Premium loading state while resolving session (Zero UI flicker)
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-indigo border-t-transparent animate-spin" />
          <p className="text-xs font-mono tracking-widest text-[#666d7c] dark:text-[#8c96aa] uppercase">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

#### Step 3: Wrap `(dashboard)/layout.tsx`
Update: `frontend/src/app/(dashboard)/layout.tsx`

```tsx
import { AppHeader } from "@core/components/layout/app-header";
import { AuthGuard } from "@features/auth/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-[#0e121c] dark:text-[#edf0f9] flex flex-col transition-colors duration-200">
        <AppHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
```

---

### Work Item 2: Zero-Latency Theme Engine (Eliminating FOUC)

#### Objective
Execute theme determination in `< 1ms` before first paint. Eliminate the 1–2 second dark-to-light flash.

#### Step 1: Update Root Layout
Update: `frontend/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Career OS",
  description: "Personal Career Operating System",
};

// Zero-runtime blocking inline script
const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('cos-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = saved === 'dark' || (!saved && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### Step 2: Refactor `ThemeProvider`
Update: `frontend/src/core/providers/theme-provider.tsx`

```tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read actual class currently on the DOM (set by blocking head script)
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  function applyTheme(newTheme: Theme) {
    if (newTheme === "dark") {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("cos-theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
```

---

### Work Item 3: Problem Progress Persistence (End-to-End Core Loop)

#### Objective
Enable users to check off problems (SOLVED / ATTEMPTED / REVISE / NOT_STARTED) and persist progress directly in PostgreSQL via `ProgressRepository`.

#### Step 1: Create Progress Controller
Create file: `backend/src/controllers/progress.controller.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { ProgressRepository } from "../repositories/progress.repository";
import { ProgressStatus } from "@prisma/client";
import { z } from "zod";
import { BadRequestError, UnauthorizedError } from "../errors/appError";

const UpdateProgressSchema = z.object({
  status: z.nativeEnum(ProgressStatus),
  aiNotes: z.string().optional().nullable(),
});

export class ProgressController {
  constructor(private progressRepo = new ProgressRepository()) {}

  updateProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const problemId = String(req.params.problemId || "").trim();
      if (!problemId) throw new BadRequestError("problemId is required");

      const parsed = UpdateProgressSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError("Invalid progress payload");
      }

      const event = await this.progressRepo.upsertProgressEvent({
        userId,
        problemId,
        status: parsed.data.status,
        aiNotes: parsed.data.aiNotes,
      });

      res.status(200).json({
        success: true,
        message: "Progress updated successfully",
        data: event,
      });
    } catch (err) {
      next(err);
    }
  };
}
```

#### Step 2: Register Progress Route
Create file: `backend/src/routes/v1/progress.routes.ts`

```typescript
import { Router } from "express";
import { ProgressController } from "../../controllers/progress.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
const controller = new ProgressController();

router.use(authenticate);
router.post("/:problemId", controller.updateProgress);

export default router;
```

In `backend/src/routes/v1/index.ts`, register:
```typescript
import progressRoutes from "./progress.routes";
// ...
router.use("/progress", progressRoutes);
```

#### Step 3: Create Frontend Progress Service
Create file: `frontend/src/features/problems/services/problem.service.ts`

```typescript
import { apiClient } from "@/lib/api-client";
import type { ProgressStatus } from "../types";

export interface UpdateProgressResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    userId: string;
    problemId: string;
    status: ProgressStatus;
    solvedAt: string | null;
  };
}

export async function updateProblemProgress(
  problemId: string,
  status: ProgressStatus,
  aiNotes?: string | null
): Promise<UpdateProgressResponse> {
  return apiClient.post<UpdateProgressResponse>(`/progress/${problemId}`, {
    status,
    aiNotes,
  });
}
```

Export from `frontend/src/features/problems/index.ts`:
```typescript
export * from "./services/problem.service";
```

#### Step 4: Wire Optimistic Updates in `RoadmapView`
In `frontend/src/features/roadmaps/components/roadmap.tsx`:
Import `updateProblemProgress` and update `toggleProblemStatus`:

```typescript
import { updateProblemProgress } from "@features/problems";

// Inside RoadmapView:
const toggleProblemStatus = async (problemId: string) => {
  // 1. Snapshot previous state for rollback
  const previousRoadmap = roadmap;
  
  // Find current status
  let nextStatus: ProgressStatus = "SOLVED";
  for (const topic of roadmap.topics) {
    const prob = topic.problems.find(p => p.problemId === problemId);
    if (prob) {
      nextStatus = prob.status === "SOLVED" ? "NOT_STARTED" : "SOLVED";
      break;
    }
  }

  // 2. Apply optimistic local update immediately
  setRoadmap((prev) => {
    let solvedCountDelta = 0;
    const updatedTopics = prev.topics.map((t) => {
      const updatedProblems = t.problems.map((p) => {
        if (p.problemId === problemId) {
          if (nextStatus === "SOLVED") solvedCountDelta += 1;
          else solvedCountDelta -= 1;

          return {
            ...p,
            status: nextStatus,
            solvedAt: nextStatus === "SOLVED" ? new Date().toISOString() : null,
          };
        }
        return p;
      });

      const solved = updatedProblems.filter((p) => p.status === "SOLVED").length;
      const total = updatedProblems.length;
      return {
        ...t,
        problems: updatedProblems,
        solved,
        progressPercentage: total > 0 ? Math.round((solved / total) * 1000) / 10 : 0,
      };
    });

    const totalSolved = Math.max(0, prev.solvedProblems + solvedCountDelta);
    return {
      ...prev,
      solvedProblems: totalSolved,
      progressPercentage:
        prev.totalProblems > 0 ? Math.round((totalSolved / prev.totalProblems) * 1000) / 10 : 0,
      topics: updatedTopics,
    };
  });

  // 3. Persist to backend in background; rollback on failure
  try {
    await updateProblemProgress(problemId, nextStatus);
  } catch (error) {
    // Rollback to previous state on failure
    setRoadmap(previousRoadmap);
  }
};
```

---

### Work Item 4: Workspace Settings API Connection

#### Objective
Fix the `GET /settings` 404 error and load existing API keys and GitHub integration settings on page mount.

#### Step 1: Update Frontend Setting Service
Update: `frontend/src/features/settings/services/setting-service.ts`

```typescript
import type { ApiKeyResponse, CreateApiKeyResult, GithubConfigResponse, GithubConfigForm } from "../types";
import { apiClient } from "@/lib/api-client";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Concurrently fetch API keys and GitHub config using existing backend routes
export async function fetchSettings(): Promise<{
  apiKeys: ApiKeyResponse[];
  githubConfig: GithubConfigResponse | null;
}> {
  try {
    const [keysResponse, githubResponse] = await Promise.all([
      apiClient.get<ApiResponse<ApiKeyResponse[]>>("/settings/api-keys").catch(() => null),
      apiClient.get<ApiResponse<GithubConfigResponse>>("/settings/github").catch(() => null),
    ]);

    return {
      apiKeys: keysResponse?.data || [],
      githubConfig: githubResponse?.data || null,
    };
  } catch {
    return { apiKeys: [], githubConfig: null };
  }
}
```

#### Step 2: Add `useEffect` to `SettingsPage`
Update: `frontend/src/features/settings/components/settings-page.tsx`

```typescript
import { useEffect } from "react";
import { fetchSettings } from "../services/setting-service";

// Inside SettingsPage():
const [isLoadingInitial, setIsLoadingInitial] = useState(true);

useEffect(() => {
  let isMounted = true;

  async function loadInitialData() {
    setIsLoadingInitial(true);
    try {
      const { apiKeys, githubConfig: savedGithub } = await fetchSettings();
      if (!isMounted) return;

      if (apiKeys) setApiKeys(apiKeys);
      if (savedGithub && savedGithub.isConfigured) {
        setGithubConfig({
          githubUsername: savedGithub.githubUsername,
          githubRepo: savedGithub.githubRepo,
          githubBranch: savedGithub.githubBranch,
          personalAccessToken: "••••••••••••••••", // Masked placeholder
        });
        setIsVerified(true);
      }
    } finally {
      if (isMounted) setIsLoadingInitial(false);
    }
  }

  loadInitialData();
  return () => { isMounted = false; };
}, []);
```

---

### Work Item 5: Prisma Repository Runtime Query Fixes

#### Objective
Fix Prisma Client crashes when viewing or deleting roadmaps.

#### Root Cause
In `backend/src/repositories/roadmap.repository.ts`:
- `prisma.roadmap.findUnique({ where: { id, userId } })`
- `prisma.roadmap.delete({ where: { id, userId } })`
In Prisma, `where` in `findUnique` and `delete` **only** accepts unique fields or compound unique constraints (`@@unique([id, userId])`). Passing non-unique fields causes a runtime exception:
`Argument where of type RoadmapWhereUniqueInput needs at least one of id, but provided id and userId`.

#### Fix
Update: `backend/src/repositories/roadmap.repository.ts`

```typescript
// Replace findRoadmapById (line 32)
findRoadmapById(id: string, userId: string) {
  return prisma.roadmap.findFirst({
    where: { id, userId },
    include: {
      roadmapProblems: {
        include: {
          problem: {
            include: {
              progressEvents: {
                where: { userId },
              },
              submissions: {
                where: { userId },
              },
            },
          },
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });
}

// Replace deleteRoadmap (line 97)
async deleteRoadmap(id: string, userId: string): Promise<Roadmap> {
  // First verify user ownership
  const roadmap = await prisma.roadmap.findFirst({
    where: { id, userId },
  });

  if (!roadmap) {
    throw new NotFoundError("Roadmap not found or access denied");
  }

  // Delete safely by unique primary key
  return prisma.roadmap.delete({
    where: { id },
  });
}
```

---

### Work Item 6: Import Redirection & Curated Roadmaps Seeding

#### Objective
1. Fix the field mismatch causing imports to always open the demo roadmap.
2. Allow users to seed the curated NeetCode 150 roadmap directly into their personal database.

#### Step 1: Fix Field Mismatch
Update: `frontend/src/app/(dashboard)/dashboard/import/page.tsx`
Change lines 41–46:
```typescript
const roadmapId = response?.data?.id || response?.data?.roadmapId;

if (roadmapId) {
  setSuccessMessage("Roadmap queued for extraction!");
  setTimeout(() => {
    router.push(`/dashboard/roadmap/${roadmapId}`);
  }, 1000);
}
```

#### Step 2: Implement Curated Roadmap Clone/Seed Flow
When a user clicks "Import NeetCode 150", rather than navigating to a client-only mock route:
1. Backend checks if the user already has a roadmap titled "NeetCode 150".
2. If not, it clones canonical problems into `roadmaps` + `roadmap_problems` rows via `cloneRoadmapWithProblems`.
3. Returns `{ id: createdRoadmap.id }`.
4. The frontend redirects to `/dashboard/roadmap/${id}`, where real database progress tracking takes over.

---

### Work Item 7: Redis-Backed Rate Limiting with RFC 6585 Headers

#### Objective
Protect auth and platform endpoints using a Redis sliding-window counter algorithm with standardized rate-limit headers.

#### Required Headers (RFC 6585 & IETF Draft):
* `RateLimit-Limit`: Maximum requests permitted within the sliding window.
* `RateLimit-Remaining`: Number of requests remaining.
* `RateLimit-Reset`: Seconds remaining until the quota fully resets.
* `Retry-After`: Sent with `429 Too Many Requests` indicating how long to wait.

#### Implementation
Create file: `backend/src/middleware/rateLimit.middleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import redis from "../config/redis";
import { logger } from "../utils/logger";

const log = logger.child({ middleware: "RateLimiter" });

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function createRateLimiter({
  windowSeconds,
  maxRequests,
  keyPrefix = "rl",
}: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.user?.userId || req.ip || "unknown-client";
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      // Redis pipeline: sliding-window sorted set
      const multi = redis.multi();
      // 1. Remove expired timestamps outside sliding window
      multi.zremrangebyscore(key, 0, windowStart);
      // 2. Add current request timestamp
      multi.zadd(key, now, `${now}-${Math.random()}`);
      // 3. Count total requests in window
      multi.zcard(key);
      // 4. Set TTL
      multi.expire(key, windowSeconds + 1);

      const results = await multi.exec();
      const count = (results?.[2]?.[1] as number) || 1;

      const remaining = Math.max(0, maxRequests - count);
      const resetSeconds = windowSeconds;

      // Set standard RFC headers
      res.setHeader("RateLimit-Limit", maxRequests);
      res.setHeader("RateLimit-Remaining", remaining);
      res.setHeader("RateLimit-Reset", resetSeconds);

      if (count > maxRequests) {
        res.setHeader("Retry-After", resetSeconds);
        res.status(429).json({
          success: false,
          error: "Too Many Requests",
          message: `Rate limit exceeded. Please retry after ${resetSeconds} seconds.`,
        });
        return;
      }

      next();
    } catch (err: any) {
      log.error({ err: err.message, key }, "Redis rate limiter failure; failing open");
      // Fail open to avoid blocking legitimate users if Redis has a transient hiccup
      next();
    }
  };
}

// Pre-configured limiters
export const authRateLimiter = createRateLimiter({
  windowSeconds: 900, // 15 minutes
  maxRequests: 10,
  keyPrefix: "rl:auth",
});

export const apiRateLimiter = createRateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 120,
  keyPrefix: "rl:api",
});
```

Mount on routes in `backend/src/routes/v1/auth.routes.ts`:
```typescript
import { authRateLimiter } from "../../middleware/rateLimit.middleware";

router.post("/login", authRateLimiter, validateLoginBody, authController.loginUser);
router.post("/register", authRateLimiter, validateRegisterBody, authController.registerUser);
```

---

### Work Item 8: Environment & Port Alignment

#### Objective
Eliminate local development port collisions.

#### Change Details
In `backend/src/config/env.ts` line 10:
```typescript
PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
```
In `backend/.env.example` line 1:
```ini
PORT=5000
```
This aligns the backend default port directly with `frontend/src/core/config/env.ts` (`http://localhost:5000/api/v1`), so `npm run dev` works immediately without port conflicts.

---

## 4. Verification & Acceptance Checklist

When you complete each work item, verify against this criteria:

- [ ] **Auth Route Guard (WI-1)**:
  - Opening `http://localhost:3000/dashboard` in an Incognito window immediately redirects to `/login?from=/dashboard`.
  - Logging in successfully forwards back to `/dashboard`.
  - While logged in, visiting `/login` redirects directly to `/dashboard`.
- [ ] **Theme Zero-Flicker (WI-2)**:
  - Set theme to "Light Mode".
  - Hard refresh (`Ctrl + Shift + R`).
  - Screen opens directly in crisp white with zero dark flashes.
- [ ] **Prisma Queries (WI-5)**:
  - Visiting a roadmap detail page `/dashboard/roadmap/<uuid>` loads problems without Prisma client validation crashes.
  - Deleting a roadmap returns HTTP 200 and removes the row from the database.
- [ ] **Problem Progress Persistence (WI-3)**:
  - Check the box for a problem on the roadmap page.
  - Check database: `SELECT * FROM progress_events WHERE problem_id = '<id>';` contains `status = 'SOLVED'`.
  - Reload page: The problem remains checked as SOLVED.
- [ ] **Settings Integration (WI-4)**:
  - Opening `/dashboard/settings` fetches and displays existing API keys and configured GitHub repository without throwing 404s in the browser console.
- [ ] **Import Redirection (WI-6)**:
  - Ingesting a URL navigates to the real roadmap ID rather than falling back to `sample-neetcode-150`.
- [ ] **Rate Limiter (WI-7)**:
  - Repeated failed login attempts return HTTP 429 with `RateLimit-Limit`, `RateLimit-Remaining`, and `Retry-After` headers.

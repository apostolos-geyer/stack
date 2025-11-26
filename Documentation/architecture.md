# Architecture

This document describes the architecture of the template-stack monorepo, intended to become `create-apostoli-app`.

## Overview

A modular monolith built with Turborepo and pnpm workspaces. Designed to provide a complete fullstack starter with web (Next.js) and native (Expo) apps sharing business logic.

## Package Architecture

```
apps/
  web/                  # Next.js 16 + React 19 + Tailwind 4
  native/               # Expo 54 + NativeWind

packages/
  # API Layer
  api.http/             # Hono webhook factories (edge-deployable)
  api.trpc/             # tRPC router with Procedure.public/protected

  # Infrastructure
  infra.auth/           # Better-auth with Prisma, Stripe, Expo, email
  infra.db/             # Prisma 7 with provider adapters

  # Libraries
  lib.client/           # React Query, TanStack Form, auth controllers
  lib.server/           # Context creation, services
  lib.email/            # Resend + React Email templates

  # UI
  ui.web/               # shadcn components
  ui.native/            # NativeWind components
  ui.style/             # Tailwind theme/design tokens
  ui.utils/             # Shared utilities (cn, etc.)

  # Config
  cfg.env/              # Zod-validated env vars (@t3-oss/env-nextjs)
  cfg.eslint/           # ESLint config
  cfg.ts/               # TypeScript base configs
```

## Package Details

### api.http

Hono app factories for webhook implementations. Designed for edge deployment (Cloudflare Workers, Vercel Edge).

**Pattern:**
```typescript
export const create = ({ basePath, message }: Configuration) =>
  new Hono()
    .basePath(basePath)
    .use(logger())
    .post("/", async (c) => c.text(message));
```

### api.trpc

tRPC router for queries and mutations. Main API controller layer.

**Pattern:**
```typescript
import { router, Procedure } from "./init";

export const appRouter = router({
  public: Procedure.public.query(() => "hello"),
  protected: Procedure.protected.query(({ ctx }) => ctx.user),
});
```

**Exports:**
- `.` - appRouter
- `./init` - router, Procedure, middleware utilities
- `./handler` - Next.js route handler

### infra.auth

Better-auth configuration with comprehensive integrations.

**Features:**
- Prisma adapter (SQLite/PostgreSQL)
- Email verification via lib.email
- Password reset flow
- Stripe plugin (customer creation on signup)
- Expo plugin (mobile auth)
- nextCookies plugin (Next.js SSR)
- Trusted origins for Expo development

**Exports:**
- `.` - auth instance, types
- `./client` - Web client (conditional export for react-native)
- `./client.native` - Native client with expo-secure-store
- `./auth` - Auth configuration
- `./handler` - Next.js route handler

**Dual Client Pattern:**
```typescript
// Web client (client.ts)
import { createAuthClient } from 'better-auth/react'

// Native client (client.native.ts)
import * as SecureStore from 'expo-secure-store'
import { expoClient } from '@better-auth/expo/client'
// Uses SecureStore instead of localStorage
```

### infra.db

Prisma 7 with database provider adapters.

**Supported Providers:**
- PostgreSQL (local with Docker)
- SQLite (file-based)
- Neon (serverless PostgreSQL)
- Supabase (hosted PostgreSQL)
- Turso (distributed SQLite)

**Pattern:**
```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './generated/prisma/client'

const adapter = new PrismaLibSql({ url: serverEnv.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })
```

### lib.server

Server-side utilities. Framework-agnostic context and services.

**Context Types:**
```typescript
// Environment-agnostic context (tRPC, Hono, tests, CLI)
type InnerContext = {
  db: PrismaClient;
  auth: Auth;
  session: AuthSession | null;
  user: AuthUser | null;
};

// Authenticated context (guaranteed user/session)
type AuthenticatedContext = {
  db: PrismaClient;
  auth: Auth;
  session: AuthSession;
  user: AuthUser;
};
```

**Service Pattern:**
```typescript
export const UserService = {
  async getById(ctx: InnerContext, id: string): Promise<User | null>,
  async me(ctx: AuthenticatedContext): Promise<User>,
  async updateProfile(ctx: AuthenticatedContext, data: {...}): Promise<User>,
}
```

### lib.client

Client-side utilities. Platform-agnostic (web + native).

**Features:**
- React Query setup with tRPC integration
- TanStack Form context helpers
- Auth form controllers (sign-in, sign-up)
- SSR hydration utilities

**Form Controller Pattern:**
```typescript
// Schema definition
export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

// Form options for TanStack Form
export const signInFormOpts = formOptions({ defaultValues: {...} });

// Handler factory (receives auth client)
export function createHandleSignIn(authClient: AuthClient) {
  return async (data: SignInData, callbacks: {...}) => {
    // Call authClient, handle success/error
  };
}
```

### lib.email

Email sending via Resend with React Email templates.

**Components:**
- `EmailLayout` - Reusable wrapper with theming
- `VerificationEmail` - Email verification template
- `ResetPasswordEmail` - Password reset template

**Constants:**
```typescript
export const EMAIL_COLORS = { primary: '#0f172a' }
export const EMAIL_FONTS = { sans: 'system-ui, ...' }
export const EMAIL_WIDTH = 600
```

### cfg.env

Environment variable validation using @t3-oss/env-nextjs and Zod.

**Server env:**
```typescript
export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().optional(),
    // ... OAuth providers
  },
  experimental__runtimeEnv: process.env,
});
```

## Key Patterns

### Internal Package Naming

All packages use `@_/` prefix:
```typescript
import { auth } from "@_/infra.auth"
import { prisma } from "@_/infra.db"
import { Button } from "@_/ui.web/components/button"
```

### Dependency Catalogs

Version management via `pnpm-workspace.yaml` catalogs:
```yaml
catalog:
  react: '>=19.1.0 <19.2.0'
  next: ^15.5.0
  # ...

catalogs:
  native:
    expo: ~54.0.25
    react: 19.1.0
    # ...
```

Usage: `"react": "catalog:"` or `"react": "catalog:native"`

### Context Flow

```
HTTP Request
    │
    ├── Next.js Route Handler
    │   └── auth.api.getSession()
    │       └── createInnerContext({ db, auth, session, user })
    │           └── tRPC/Hono handler receives context
    │               └── Services use context for DB/auth operations
```

### Form Integration

```
lib.client/form.tsx
    │
    ├── createFormComponent() - Wraps TanStack Form context
    ├── createFieldComponent() - Wraps field context
    └── createHooks() - Creates useAppForm hook
        │
        └── ui.web/form.ts
            └── useAppForm({ fieldComponents: {...} })
                │
                └── apps/web sign-in page
                    └── Uses controller from lib.client/controllers/auth
```

## Future Architecture

### Planned: features.client / features.server

Extract business logic from lib.* packages:

```
packages/
  features.client/      # Form controllers, client business logic
    controllers/auth/
  features.server/      # Services, server business logic
    services/
  lib.client/           # Framework utilities only
  lib.server/           # Context utilities only
```

### Planned: create-apostoli-app CLI

```bash
npx create-apostoli-app my-app
```

Interactive prompts for:
- Database provider
- Auth configuration
- Social providers
- Stripe integration
- Email provider
- Native app inclusion

## Environment Variables

Required:
- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Auth secret (min 32 chars)
- `BETTER_AUTH_URL` - Auth URL (e.g., http://localhost:3000)

Optional:
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` / `EMAIL_FROM`
- OAuth: `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, etc.

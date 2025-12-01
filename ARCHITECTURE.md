# Architecture

This document describes the core patterns and architecture of this monorepo template.

## Overview

A Turborepo monorepo with pnpm workspaces implementing **vertical slices** across three layers:

```
UI Layer          →  apps/web, apps/native (composed from ui primitives)
Client Features   →  features.client (React hooks, providers, mutations)
API Layer         →  api.trpc (thin wrappers), api.http (webhooks)
Server Features   →  features (services, context, auth)
Data Layer        →  db (Prisma)
```

## Data Flow

```
Component
    ↓
features.client hook (useQuery/useMutation with useTRPC)
    ↓
api.trpc router (validates input, calls service)
    ↓
features service (business logic with context)
    ↓
db (Prisma)
```

## Vertical Slices

### Server: `@_/features`

Contains services and context. Services are plain objects with async functions:

```typescript
export const UserService = {
  async getById(ctx: InnerContext, id: string): Promise<User | null> {
    return ctx.db.user.findUnique({ where: { id } });
  },
  async me(ctx: AuthenticatedContext): Promise<User> {
    return ctx.db.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  },
};
```

**Convention**: First parameter is always context (`InnerContext` or `AuthenticatedContext`).

### API: `@_/api.trpc`

Thin router wrappers over services with Zod validation:

```typescript
export const userRouter = router({
  me: Procedure.protected.query(({ ctx }) => UserService.me(ctx)),
  updateProfile: Procedure.protected
    .input(z.object({ name: z.string().optional() }))
    .mutation(({ ctx, input }) => UserService.updateProfile(ctx, input)),
});
```

### Client: `@_/features.client`

React hooks and providers using TanStack Query with tRPC:

```typescript
function Component() {
  const trpc = useTRPC();
  const user = useQuery(trpc.user.me.queryOptions());
  const update = useMutation(trpc.user.updateProfile.mutationOptions());
}
```

## Context System

Two context types flow through the stack:

| Type | Description |
|------|-------------|
| `InnerContext` | `{ db, auth, session, user }` - user/session may be null |
| `AuthenticatedContext` | Same, but user/session guaranteed non-null |

Created via `createInnerContext()` in request handlers, passed to services.

## Better-Auth Exception

Auth is handled differently from other features. Better-auth provides:
- Complete query/mutation interface via `authClient`
- Plugin system (admin, stripe, organizations)
- Session hooks (`useSession`)

**Pattern**: `features.client/auth` wraps `authClient` directly instead of going through tRPC. This avoids unnecessary abstraction over an already well-designed API.

```typescript
// Auth uses authClient directly
const { authClient } = useAuthFeatures();
await authClient.signIn.email({ email, password });

// Other features use tRPC
const trpc = useTRPC();
const result = useMutation(trpc.upload.getPresignedUrl.mutationOptions());
```

## UI Architecture

Three-layer separation:

| Package | Purpose |
|---------|---------|
| `ui.style` | Tailwind v4 config, CSS tokens, TypeScript token generation |
| `ui.web` | shadcn/Radix primitives for web |
| `ui.native` | NativeWind + React Native Reusables primitives |

**Higher-level composed blocks live in apps**, not packages. This keeps primitives reusable.

### Token System

Design tokens defined in CSS (`tokens.css`) and generated to TypeScript (`tokens.ts`) with multiple color space support (OKLCH, hex, P3).

### NativeWind v5 Note

`ui.native` uses NativeWind v5 preview with Tailwind v4. A Tailwind v3 config stub exists for compatibility with react-native-reusables (which doesn't support nativewind v5 yet).

## Feature Provider Pattern

Client features use React Context + the `Provide` HOC:

```typescript
const SignInPage = Provide(
  [createAuthFeatures(authClient), createLoginFeatures()],
  function SignInPage() {
    const { signInMutation } = useLoginFeatures();
    // Component implementation
  }
);
```

## Tooling

| Tool | Purpose |
|------|---------|
| **pnpm** | Workspace management with `catalog:` for version consistency |
| **Turborepo** | Task orchestration, caching, parallel execution |
| **Prisma** | ORM with provider-switchable adapters |
| **Biome** | Linting and formatting (`pnpm check`, `pnpm format`) |
| **TypeScript** | Shared config via `@_/cfg.ts` |
| **Docker Compose** | Local Postgres + Minio (`pnpm services:up`) |

## Environment Variables

Validated with Zod via `@_/platform`:

```typescript
import { env } from '@_/platform/server'; // Server env
import { env } from '@_/platform/client'; // Client env (NEXT_PUBLIC_*)
```

Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`

## Prisma Schema

The schema includes tables generated from better-auth's `auth.ts` configuration. After modifying auth config:

```bash
pnpm db:generate    # Regenerate Prisma client
pnpm db:migrate:dev # Run migrations
```

## Adding a New Feature

1. **Service** in `packages/features/src/{feature}/service.ts`
2. **Router** in `packages/api.trpc/src/routers/{feature}.ts`
3. **Hooks** in `packages/features.client/src/{feature}/hooks.ts`
4. **Provider** (optional) in `packages/features.client/src/{feature}/index.tsx`

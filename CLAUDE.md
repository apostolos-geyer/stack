# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install              # install dependencies
pnpm dev                  # run all apps (web + native)
pnpm build                # build all packages
pnpm lint                 # lint all packages
pnpm db:generate          # regenerate prisma client
pnpm db:migrate:dev       # run migrations (add --name <name>)
pnpm db:studio            # open prisma studio
```

Run a single package:
```bash
pnpm --filter web dev
pnpm --filter native dev
pnpm --filter @_/infra.db db:migrate:dev --name init
```

## Architecture

Turborepo monorepo with pnpm workspaces. All internal packages use `@_/` prefix.

### Apps
- `apps/web` - Next.js 16 app with React 19, Tailwind 4
- `apps/native` - Expo 54 app with NativeWind

### Core Packages
- `@_/infra.db` - Prisma 7 with libsql adapter, exports `prisma` client
- `@_/infra.auth` - Better-auth with Prisma adapter, Stripe integration, Expo support
- `@_/api.trpc` - tRPC router with `Procedure.public` and `Procedure.protected`
- `@_/api.http` - Hono webhook factory pattern
- `@_/lib.server` - Server context (`InnerContext`, `AuthenticatedContext`)
- `@_/lib.client` - React Query, TanStack Form exports, auth form controllers
- `@_/lib.email` - Resend email with React Email templates

### UI Packages
- `@_/ui.web` - shadcn components for web
- `@_/ui.native` - NativeWind components for React Native
- `@_/ui.style` - Shared Tailwind theme
- `@_/ui.utils` - Shared utilities (cn, etc.)

### Config Packages
- `@_/cfg.ts` - Base TypeScript config
- `@_/cfg.eslint` - ESLint config
- `@_/cfg.env` - Zod-validated environment variables via @t3-oss/env-nextjs

## Key Patterns

### tRPC Procedures
```typescript
import { router, Procedure } from "./init";

export const appRouter = router({
  public: Procedure.public.query(() => "hello"),
  protected: Procedure.protected.query(({ ctx }) => ctx.user),
});
```

### tRPC Client (TanStack Query v5 Integration)

**IMPORTANT**: Use the native TanStack Query hooks with tRPC's `queryOptions`/`mutationOptions` pattern:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@_/lib.client';

function Component() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Queries - use queryOptions pattern
  const userQuery = useQuery(trpc.user.me.queryOptions());
  const postsQuery = useQuery(trpc.posts.list.queryOptions({ limit: 10 }));

  // Mutations - use mutationOptions pattern
  const createMutation = useMutation(trpc.posts.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.posts.list.queryKey() });
    },
  }));

  // Call mutation
  createMutation.mutate({ title: 'New Post' });
}
```

**Key patterns:**
- `trpc.route.queryOptions(input?, options?)` - for useQuery
- `trpc.route.mutationOptions(options?)` - for useMutation
- `trpc.route.queryKey()` - for cache invalidation
- `trpc.route.pathKey()` - for invalidating all queries under a path
- Use `skipToken` from `@tanstack/react-query` for conditional queries

See `Documentation/trpc-patterns.md` for comprehensive examples.

### Hono Webhooks
```typescript
export const create = ({ basePath, message }: Configuration) =>
  new Hono()
    .basePath(basePath)
    .post("/", async (c) => c.text(message));
```

### Server Context
`lib.server` provides `InnerContext` (db, auth, session, user) used across tRPC, Hono, and tests. `AuthenticatedContext` guarantees non-null user/session.

```typescript
// Creating context (in apps/web/lib/context.ts)
export async function createContext(): Promise<InnerContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  return createInnerContext({
    db: prisma,
    auth,
    session: session?.session ?? null,
    user: session?.user ?? null,
  });
}
```

### Service Pattern
Services are plain objects with async functions. First param is always context:
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

### Feature Provider Pattern
Features are React Context providers in `features.client` that expose hooks, mutations, and schemas:

```typescript
// features.client/src/auth/login.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthFeatures } from './index';
import { signInSchema, type SignInData } from './schemas';

export function createLoginFeatures() {
  return function LoginFeaturesProvider({ children }: { children: ReactNode }) {
    const { authClient } = useAuthFeatures();

    const signInMutation = useMutation({
      mutationFn: async (data: SignInData) => {
        const result = await authClient.signIn.email(data);
        if (result.error) throw new Error(result.error.message);
      },
    });

    return (
      <LoginFeaturesContext.Provider value={{ signInSchema, signInMutation }}>
        {children}
      </LoginFeaturesContext.Provider>
    );
  };
}
```

Use with the `Provide` HOC:
```typescript
import { Provide } from '@_/lib.client';
import { createAuthFeatures } from '@_/features.client/auth';
import { createLoginFeatures, useLoginFeatures } from '@_/features.client/auth/login';

const SignInPage = Provide(
  [createAuthFeatures(authClient), createLoginFeatures()],
  function SignInPage() {
    const { signInSchema, signInMutation } = useLoginFeatures();
    // Component creates its own form, uses mutations from features
  }
);
```

### Auth Integration
Auth configured in `@_/infra.auth/auth.ts`. Dual client pattern:
- Web: `import { authClient } from "@_/infra.auth/client"`
- Native: Auto-resolves to `client.native.ts` with expo-secure-store

### Environment Variables
Server env via `@_/cfg.env/server`, client env via `@_/cfg.env/client`. Validated with Zod. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

## Package Purpose Guide

| Package | Purpose | When to modify |
|---------|---------|----------------|
| `api.trpc` | tRPC router | Adding queries/mutations |
| `api.http` | Hono webhooks | Adding webhook handlers |
| `infra.auth` | Auth config | Changing auth providers/plugins |
| `infra.db` | Prisma client | Schema changes (prisma/schema.prisma) |
| `features.client` | Client feature providers | Adding new features, mutations, queries |
| `features.server` | Server services/context | Adding business logic, services |
| `lib.server` | Server utilities | Framework-agnostic server helpers |
| `lib.client` | Client utilities | Hooks, Provide HOC, tRPC context |
| `lib.email` | Email templates | Adding email templates |
| `ui.web` | Web components | Adding shadcn components |
| `ui.native` | Native components | Adding RN components |
| `ui.style` | Tailwind theme | Changing design tokens |
| `cfg.env` | Env validation | Adding new env vars |

## Package Catalog

Dependencies are managed via `pnpm-workspace.yaml` catalogs for version consistency. Use `catalog:` or `catalog:native` for React Native dependencies.

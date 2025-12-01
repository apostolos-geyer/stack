# Template Stack

Monorepo starter with the essentials wired up: Prisma 7, better-auth, Next.js + tRPC + React Query, Expo + NativeWind, webhook factory with Hono.

## Quick Start

```bash
pnpm install
pnpm settings db:switch           # Pick database provider (default: sqlite)
pnpm db:generate
pnpm db:migrate:dev --name init
pnpm dev
```

**Prerequisites**: Node 22+, pnpm 10+, Docker (for Postgres/Minio)

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps |
| `pnpm build` | Build all packages |
| `pnpm check` | Lint with Biome |
| `pnpm format:fix` | Format with Biome |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate:dev` | Run migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm services:up` | Start Docker services (Postgres, Minio) |
| `pnpm settings` | Database provider settings tool |

## Database Providers

Switch providers via `pnpm settings db:switch`:

- sqlite (libsql adapter)
- postgres (Docker, unmanaged)
- prisma-postgres (managed)
- supabase (pooled + direct URLs)
- neon (edge or local)
- turso (distributed sqlite)

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for patterns and data flow.

**Key concepts**:
- Vertical slices: `features` (server) → `api.trpc` (routers) → `features.client` (React)
- Context system: `InnerContext` / `AuthenticatedContext`
- UI primitives in packages, composed blocks in apps
- Better-auth handles auth directly (not wrapped in tRPC)

## Apps

| App | Description | README |
|-----|-------------|--------|
| [web](./apps/web) | Next.js 15 with React 19, Tailwind 4 | [README](./apps/web/README.md) |
| [native](./apps/native) | Expo 54 with NativeWind | [README](./apps/native/README.md) |
| [storybook.web](./apps/storybook.web) | Component documentation | [README](./apps/storybook.web/README.md) |

## Packages

### Core

| Package | Description | README |
|---------|-------------|--------|
| [@_/features](./packages/features) | Server services, context, auth config | [README](./packages/features/README.md) |
| [@_/features.client](./packages/features.client) | React hooks, providers, mutations | [README](./packages/features.client/README.md) |
| [@_/api.trpc](./packages/api.trpc) | tRPC routers | [README](./packages/api.trpc/README.md) |
| [@_/api.http](./packages/api.http) | Hono webhook factory | [README](./packages/api.http/README.md) |
| [@_/db](./packages/db) | Prisma client and migrations | [README](./packages/db/README.md) |

### UI

| Package | Description | README |
|---------|-------------|--------|
| [@_/ui.web](./packages/ui.web) | shadcn/Radix components | [README](./packages/ui.web/README.md) |
| [@_/ui.native](./packages/ui.native) | NativeWind components | [README](./packages/ui.native/README.md) |
| [@_/ui.style](./packages/ui.style) | Tailwind config, tokens | [README](./packages/ui.style/README.md) |
| [@_/ui.utils](./packages/ui.utils) | Class name utilities (cn) | [README](./packages/ui.utils/README.md) |

### Libraries

| Package | Description | README |
|---------|-------------|--------|
| [@_/lib.email](./packages/lib.email) | React Email + Resend | [README](./packages/lib.email/README.md) |
| [@_/lib.storage](./packages/lib.storage) | S3 presigned URLs | [README](./packages/lib.storage/README.md) |
| [@_/platform](./packages/platform) | Zod-validated env vars | [README](./packages/platform/README.md) |

### Config

| Package | Description | README |
|---------|-------------|--------|
| [@_/cfg.ts](./packages/cfg.ts) | TypeScript config | [README](./packages/cfg.ts/README.md) |
| [@_/cfg.eslint](./packages/cfg.eslint) | ESLint config | [README](./packages/cfg.eslint/README.md) |

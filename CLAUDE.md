# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install              # install dependencies
pnpm dev                  # run all apps (web + native)
pnpm build                # build all packages
pnpm check                # lint with biome
pnpm format:fix           # format with biome
pnpm db:generate          # regenerate prisma client
pnpm db:migrate:dev       # run migrations (add --name <name>)
pnpm db:studio            # open prisma studio
pnpm services:up          # start docker services (postgres, minio)
```

Run a single package:
```bash
pnpm --filter web dev
pnpm --filter native dev
pnpm --filter @_/db db:migrate:dev --name init
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full documentation. Key points:

- **Vertical slices**: `features` (server services) → `api.trpc` (routers) → `features.client` (React hooks)
- **Context**: `InnerContext` (nullable user) / `AuthenticatedContext` (guaranteed user)
- **Services**: Plain objects, first param is always context
- **Better-auth exception**: Auth uses `authClient` directly, not wrapped in tRPC
- **UI**: Primitives in `ui.web`/`ui.native`, composed blocks in apps

## tRPC Client Pattern

Use native TanStack Query hooks with tRPC's `queryOptions`/`mutationOptions`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@_/features.client/lib';

function Component() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Queries
  const user = useQuery(trpc.user.me.queryOptions());

  // Mutations with cache invalidation
  const update = useMutation(trpc.user.updateProfile.mutationOptions({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() }),
  }));
}
```

**Key methods:**
- `trpc.route.queryOptions(input?)` - for useQuery
- `trpc.route.mutationOptions(options?)` - for useMutation
- `trpc.route.queryKey()` - for cache invalidation
- Use `skipToken` from `@tanstack/react-query` for conditional queries

## Package Quick Reference

| Package | When to modify |
|---------|----------------|
| `api.trpc` | Adding queries/mutations |
| `api.http` | Adding webhook handlers |
| `features` | Adding services, auth config |
| `features.client` | Adding React hooks, providers |
| `db` | Schema changes |
| `ui.web` / `ui.native` | Adding components |
| `ui.style` | Changing design tokens |
| `platform` | Adding env vars |

## Catalogs

Dependencies managed via `pnpm-workspace.yaml` catalogs. Use `catalog:` for web, `catalog:native` for React Native.

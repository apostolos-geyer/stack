# lowkey tuff stack

**use it because it's lowkey tuff fam**

monorepo starter with the stuff you actually need wired up already. prisma 7 (provider-switchable), better-auth, next.js + trpc with react query, webhook factory with hono. config handled.

## database providers

bring your own env vars; settings tool ships defaults for each provider:

- sqlite (libsql adapter)
- postgres (docker, unmanaged)
- prisma-postgres (managed)
- supabase (pooled + direct URLs)
- neon (edge or local via `USE_LOCAL_DB`)
- turso (distributed sqlite)

switch via `pnpm settings db:switch --provider <id>` or menu (`pnpm settings`). env helper: `pnpm settings env:config`. details in `Documentation/database-setup.md` and `tools/settings/docs/providers.md`.

## structure

```
apps/
  web/          → next.js app

packages/
  auth/         → better-auth + prisma adapter
  db/           → prisma 7, libsql, sqlite
  trpc/         → procedures + react-query
  webhooks/     → hono webhook factory
  forms/        → tanstack form
  ui.web/       → shadcn, tailwind 4
  cfg.eslint/   → lint config
  ui.style/       → style config
  cfg.ts/       → typescript config
```

## setup

```bash
pnpm install
pnpm settings db:switch           # pick provider (defaults to sqlite)
pnpm db:generate
pnpm db:migrate:dev --name init
pnpm dev
```

## patterns

### trpc

```typescript
import { router, Procedure } from "./root";

export const appRouter = router({
  hello: Procedure.public.query(() => "hello"),
});
```

### webhooks

```typescript
export const create = ({ basePath, message }) =>
  new Hono()
    .basePath(basePath)
    .post("/", async (c) => c.text(message));
```

### auth

```typescript
import { auth } from '@_/features/auth'
```

## commands

| command | does |
|---------|------|
| `pnpm dev` | run all |
| `pnpm build` | build all |
| `pnpm db:generate` | prisma client |
| `pnpm db:migrate:dev` | migrations |
| `pnpm db:studio` | db gui |

## later

- expo starter
- webview ipc + router for native integration

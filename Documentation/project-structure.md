# structure

```
apps/
  web/              # next.js app

packages/
  auth/             # better-auth config
  db/               # prisma client
  trpc/             # api layer
  webhooks/         # hono webhook factory
  client/           # react data layer (query, trpc, forms)
  ui.web/           # shadcn components
  cfg.eslint/       # lint rules
  ui.style/           # tailwind config
  cfg.ts/           # typescript config

tools/
  settings/         # settings cli

scripts/            # utility scripts
Documentation/      # you are here
```

## packages

### @_/infra.auth

better-auth instance. exports `auth` and client utilities.

### @_/infra.db

prisma client. exports `prisma` and generated types.

### @_/api.trpc

type-safe api with react-query integration.

### @_/api.http

hono-based webhook factory pattern.

### @_/forms

tanstack form wrappers.

### @_/ui.web

shadcn components, tailwind 4.

### config packages

- `@_/cfg.eslint` - lint rules
- `@_/ui.style` - tailwind theme
- `@_/cfg.ts` - base tsconfig

## imports

```typescript
import { auth } from "@_/infra.auth"
import { prisma } from "@_/infra.db"
import { Button } from "@_/ui.web/components/button"
import { cn } from "@_/ui.web/lib/utils"
```

## key files

| file | what |
|------|------|
| `pnpm-workspace.yaml` | workspace config |
| `turbo.json` | build pipeline |
| `package.json` | root scripts |

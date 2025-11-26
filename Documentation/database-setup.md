# database

prisma 7 with driver adapters. pick your provider, swap later if needed.

## providers

### sqlite

local dev, zero config.

```env
DATABASE_URL=file:./dev.db
```

### postgres

standard postgres.

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### supabase

hosted postgres with extras.

```env
# pooled connection for queries
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# direct connection for migrations
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### neon

serverless postgres.

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.region.neon.tech/db?sslmode=require
```

use `@neondatabase/serverless` + `PrismaNeon` adapter for edge.

### turso

distributed sqlite.

```env
TURSO_DATABASE_URL=libsql://[db-name]-[user].turso.io
TURSO_AUTH_TOKEN=your-token
```

## commands

| command | what |
|---------|------|
| `pnpm --filter @_/infra.db db:generate` | generate client |
| `pnpm --filter @_/infra.db db:migrate:dev` | dev migrations |
| `pnpm --filter @_/infra.db db:migrate:deploy` | prod migrations |
| `pnpm --filter @_/infra.db db:push` | push schema directly |
| `pnpm --filter @_/infra.db db:studio` | prisma studio |

## prisma 7 notes

generator changed from `prisma-client-js` to `prisma-client`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated/client"
}
```

- `output` path is required now
- `prisma.config.ts` file is required
- driver adapters are mandatory

## links

- [prisma docs](https://www.prisma.io/docs)
- [driver adapters](https://www.prisma.io/docs/orm/overview/databases/driver-adapters)

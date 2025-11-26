# Database Package (@_/infra.db)

This package uses **Prisma Postgres** with Prisma 7.

## Quick Start

1. Start Prisma Dev: `pnpm dev` (or `pnpm db:start`)
2. The DATABASE_URL is automatically configured in `.env`
3. Run migrations: `pnpm db:migrate:dev --name init`
4. Open Prisma Studio: `pnpm db:studio`

Prisma Dev uses PgLite - a lightweight PostgreSQL that runs locally without Docker.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## Local Development

**Selected method:** Prisma Dev (PgLite)

Local PostgreSQL without Docker (auto-configured)

## Commands

```bash
pnpm db:generate    # Regenerate Prisma client
pnpm db:migrate:dev # Run migrations
pnpm db:studio      # Open Prisma Studio
```

## Official Documentation

- [Prisma + Prisma Postgres](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Prisma Postgres Docs](https://www.prisma.io/docs/orm/overview/databases/postgresql)

## Troubleshooting

**"prisma dev" command not found**
- Ensure @prisma/dev is installed: `pnpm add -D @prisma/dev`

**Connection refused**
- Start Prisma Dev first: `pnpm db:start`
- Check if running: `npx prisma dev ls`

**Port already in use**
- Stop existing instance: `npx prisma dev stop template`

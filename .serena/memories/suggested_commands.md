# Suggested Commands
- Install deps: `pnpm install` (requires Node >=22, pnpm@10). Copy envs: `cp .env.example .env && cp apps/web/.env.example apps/web/.env`; generate auth secret `./scripts/generate-secret.sh`.
- Dev workflow: `pnpm dev` (turbo dev; depends on db:generate). Per app: `pnpm --filter web dev` (Next.js with turbopack), `pnpm --filter native start|ios|android` (Expo).
- Build/lint/types: `pnpm build`, `pnpm lint`, `pnpm typecheck` (turbo fan-out through packages). Web-only: `pnpm --filter web build|lint|typecheck`.
- Database (Prisma 7): `pnpm db:generate`, `pnpm db:migrate:dev --name <msg>`, `pnpm db:migrate:deploy`, `pnpm db:push`, `pnpm db:studio` (root scripts target @_/infra.db). Prisma dev (PgLite) via `pnpm dev` or `pnpm db:migrate:dev`.
- Settings CLI (DB providers/env): `pnpm settings` (menu), `pnpm settings db:switch --provider <sqlite|prisma-postgres|supabase|neon|turso>`, `pnpm settings env:config` to scaffold env vars.
- TRPC handler generation: `pnpm gen` / `pnpm init` (turbo gen templates).
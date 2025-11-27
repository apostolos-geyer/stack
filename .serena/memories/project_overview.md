# Template Stack Overview
- Purpose: Monorepo starter intended to become `create-apostoli-app`; ships web (Next.js) + native (Expo) apps with shared infra (auth, db, api) and UI kits.
- Tech stack: Node >=22, pnpm + Turborepo, TypeScript (strict, ESM/NodeNext), Next.js 16 (React 19, Tailwind 4), Expo 54 with NativeWind, Prisma 7, tRPC 11, Hono webhooks, better-auth, Resend/React Email, Zod env validation.
- Workspace packages: infra (auth, db), api (trpc, http webhooks), libraries (lib.client/lib.server/lib.email/platform), UI (ui.web/ui.native/ui.style/ui.utils), config (cfg.ts, cfg.eslint), feature placeholders (features.client/features.server), apps (web/native), tools/settings CLI, scripts (generate-secret).
- Database providers: switchable via settings CLI (sqlite/libsql default, Prisma Postgres, Supabase, Neon, Turso). Prisma 7 with adapters; DATABASE_URL (or provider-specific) required.
- Docs: `Documentation/` covers architecture, project structure, getting-started, db setup, auth, trpc patterns; provider details in `tools/settings/docs/providers.md`.
- CI: GitHub workflows deploy Supabase migrations/functions on `develop` and `main` pushes (requires Supabase secrets).
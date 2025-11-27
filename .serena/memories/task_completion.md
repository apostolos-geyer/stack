# When Finishing a Task
- Run quality gates: `pnpm lint` and `pnpm typecheck`; add `pnpm build` if changes affect builds or deployment. No automated tests present—manual verification recommended (web pages via `pnpm --filter web dev`, auth flows, DB interactions).
- If Prisma schema changed: `pnpm db:generate` and create migrations (`pnpm db:migrate:dev --name <msg>`), update docs/env vars as needed.
- Keep env files in sync (`.env`, `apps/web/.env`); ensure required secrets (BETTER_AUTH_SECRET, DATABASE_URL, provider keys) are set for affected features.
- Respect package boundaries (`@_/` imports) and ESM/NodeNext settings; update relevant README/Documentation if behavior or commands change.
- If CI/deploy impacted (Supabase migrations/functions), note in PR and ensure workflows have required secrets.
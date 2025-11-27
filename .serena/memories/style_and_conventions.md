# Style and Conventions
- TypeScript strict across packages; ESM with NodeNext moduleResolution; base config in `packages/cfg.ts/base.json` with `noUncheckedIndexedAccess`, incremental builds.
- ESLint shared config `@_/cfg.eslint` (js recommended + typescript-eslint, turbo env var rule, only-warn plugin, dist ignored). Root `.eslintrc.js` ignores apps/packages; packages bring their own configs. No explicit formatter besides eslint-config-prettier (Prettier optional).
- Package naming uses `@_/` prefix; path aliases defined per package (e.g., `@_/ui.web/*`). Prefer keeping shared logic in libraries (`lib.*`, `features.*`) and clean imports from infra (`@_/infra.auth`, `@_/infra.db`).
- tRPC pattern: define routers with `router`/`Procedure.public|protected` from `@_/api.trpc`; handler exports for Next.js routes.
- Auth pattern: better-auth configured with Prisma adapter, email verification/reset via React Email + Resend, trusted origins include Expo dev URLs; client exports for web and native (secure store).
- UI: Tailwind 4 tokens in `@_/ui.style`; shadcn-based components in `@_/ui.web`; NativeWind components in `@_/ui.native`. Default web layout uses custom fonts (Libre Baskerville, Lora, IBM Plex Mono) and light/dark theme provider.
- Environment handling via `@_/platform/server|client` using Zod (@t3-oss/env-nextjs); keep env vars validated centrally.
# web

Next.js 15 application with React 19 and Tailwind 4.

## Purpose

Main web application. Consumes packages for UI, features, and API.

## Run

```bash
pnpm --filter web dev    # Development
pnpm --filter web build  # Production build
```

## Structure

```
app/              # Next.js App Router pages
components/       # App-specific composed components
lib/              # App utilities (context creation, etc.)
```

## Key Dependencies

- `@_/features` - Server auth, context creation
- `@_/features.client` - React hooks, providers
- `@_/api.trpc` - tRPC router types
- `@_/ui.web` - UI primitives
- `@_/ui.style` - Tailwind config

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) for data flow and patterns

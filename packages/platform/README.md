# @_/platform

Zod-validated environment variables.

## Purpose

Type-safe environment configuration with runtime validation. Separates server and client env vars.

## Exports

```typescript
// Server-side env (includes secrets)
import { env } from '@_/platform/server';

// Client-side env (NEXT_PUBLIC_* only)
import { env } from '@_/platform/client';
```

## Usage

```typescript
// Access validated env vars
const dbUrl = env.DATABASE_URL;
const authSecret = env.BETTER_AUTH_SECRET;

// Client-safe vars
const apiUrl = env.NEXT_PUBLIC_API_URL;
```

## Adding Variables

Edit `src/server.ts` or `src/client.ts`:

```typescript
export const env = createEnv({
  server: {
    MY_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_MY_VAR: z.string().optional(),
  },
  runtimeEnv: {
    MY_SECRET: process.env.MY_SECRET,
    NEXT_PUBLIC_MY_VAR: process.env.NEXT_PUBLIC_MY_VAR,
  },
});
```

## Required Variables

- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Auth encryption secret
- `BETTER_AUTH_URL` - Auth callback URL

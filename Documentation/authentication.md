# auth

better-auth with prisma adapter. lives in `packages/infra.auth`.

## env

```env
BETTER_AUTH_SECRET=your_secret
```

generate one:

```bash
./scripts/generate-secret.sh
```

### social providers (if enabled)

| provider | vars |
|----------|------|
| google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| github | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |
| apple | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` |

## client

```typescript
import { signIn, signUp, signOut, useSession } from "@_/features/auth/client"
```

### example

```typescript
"use client"

import { useSession, signOut } from "@_/features/auth/client"

export function UserMenu() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>
  if (!session) return <a href="/sign-in">Sign In</a>

  return (
    <div>
      <span>{session.user.name}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

## api route

lives at `app/api/auth/[...all]/route.ts`:

```typescript
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@_/features/auth"

export const { GET, POST } = toNextJsHandler(auth)
```

handles:
- `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/sign-out`
- `/api/auth/session`
- `/api/auth/callback/*`

## adding social providers

edit `packages/infra.auth/src/auth.ts`:

```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
})
```

### oauth setup

1. create app in provider's dev console
2. set callback: `https://yourdomain.com/api/auth/callback/{provider}`
3. grab client id + secret, add to env

**consoles:**
- [google](https://console.cloud.google.com/apis/credentials)
- [github](https://github.com/settings/developers)
- [discord](https://discord.com/developers/applications)
- [apple](https://developer.apple.com/account/resources/identifiers/list/serviceId)

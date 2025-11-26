# Better Auth + Prisma Integration Report

**Research Date:** November 2025
**Better Auth CLI Version:** 1.3.34 (latest as of research date)

---

## Table of Contents

1. [File Naming Convention](#1-file-naming-convention)
2. [Exact Setup Order](#2-exact-setup-order)
3. [CLI Commands and Flags](#3-cli-commands-and-flags)
4. [prisma generate vs @better-auth/cli generate Order](#4-prisma-generate-vs-better-authcli-generate-order)
5. [Exact Import Paths](#5-exact-import-paths)
6. [Auth Config File Structure](#6-auth-config-file-structure)
7. [Database Schema Details](#7-database-schema-details)
8. [Framework Integration (Next.js)](#8-framework-integration-nextjs)
9. [Client Setup](#9-client-setup)
10. [Configuration Options Reference](#10-configuration-options-reference)
11. [Known Issues and Workarounds](#11-known-issues-and-workarounds)
12. [Complete Code Examples](#12-complete-code-examples)

---

## 1. File Naming Convention

### Auth Configuration File

**File Name:** `auth.ts` (NOT `server.ts`)

**Supported Locations (CLI searches in this order):**
- `./auth.ts` (project root)
- `./utils/auth.ts`
- `./lib/auth.ts`
- `./src/auth.ts`
- `./src/utils/auth.ts`
- `./src/lib/auth.ts`
- `./app/lib/auth.ts`
- `./server/auth.ts`

### Export Requirements

**IMPORTANT:** Use named export `auth`, NOT default export.

```typescript
// CORRECT - Use this pattern
export const auth = betterAuth({
  // configuration
});

// AVOID - Known issues with CLI tools
export default betterAuth({
  // configuration
});
```

**Why:** There is a known bug where `@better-auth/cli generate` throws "Couldn't read your auth config" error when using default exports. The named export `export const auth` works consistently with both runtime operations and CLI tools.

### Other Required Files

| File | Location | Purpose |
|------|----------|---------|
| `auth.ts` | `src/lib/auth.ts` or `lib/auth.ts` | Server auth configuration |
| `auth-client.ts` | `src/lib/auth-client.ts` or `lib/auth-client.ts` | Client auth instance |
| `prisma.ts` | `src/lib/prisma.ts` or `lib/prisma.ts` | Prisma singleton |
| `route.ts` | `src/app/api/auth/[...all]/route.ts` | Next.js API handler |
| `schema.prisma` | `prisma/schema.prisma` | Database schema |

---

## 2. Exact Setup Order

### Complete Setup Sequence

```
1. Install packages
2. Set environment variables
3. Initialize Prisma (if not already done)
4. Run prisma generate (create initial client)
5. Create auth.ts configuration file
6. Run @better-auth/cli generate (adds auth models to schema.prisma)
7. Run prisma migrate dev (apply migrations)
8. Run prisma generate (regenerate client with new models)
9. Create API route handler
10. Create auth client
```

### Detailed Steps

#### Step 1: Install Packages

```bash
# Core packages
npm install better-auth
npm install @prisma/client

# Dev dependencies
npm install -D prisma

# Optional: CLI (can also use npx)
npm install -D @better-auth/cli
```

#### Step 2: Environment Variables

Create `.env` file in project root:

```env
# Required for Better Auth
BETTER_AUTH_SECRET=<your-secret-key>
BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

Generate secret with:
```bash
npx @better-auth/cli@latest secret
```

Or using OpenSSL:
```bash
openssl rand -base64 32
```

#### Step 3: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma`
- `.env` file (if not exists)

#### Step 4: Run Initial Prisma Generate

```bash
npx prisma generate
```

**IMPORTANT:** This must run BEFORE `@better-auth/cli generate` if you have any custom Prisma client configuration.

#### Step 5: Create Auth Configuration

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

#### Step 6: Generate Auth Schema

```bash
npx @better-auth/cli@latest generate
```

This adds User, Session, Account, and Verification models to `prisma/schema.prisma`.

#### Step 7: Apply Migrations

```bash
npx prisma migrate dev --name add-auth-models
```

#### Step 8: Regenerate Prisma Client

```bash
npx prisma generate
```

#### Step 9: Create API Handler

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

#### Step 10: Create Auth Client

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Destructured exports for convenience
export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## 3. CLI Commands and Flags

### Available Commands

| Command | Description |
|---------|-------------|
| `generate` | Creates database schema for your ORM |
| `migrate` | Applies schema directly to database (Kysely only) |
| `init` | Initializes Better Auth in your project |
| `secret` | Generates a secret key |
| `info` | Diagnostic information about your setup |

### Generate Command

```bash
npx @better-auth/cli@latest generate [options]
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--output` | Schema save location | `prisma/schema.prisma` for Prisma |
| `--config` | Path to auth config file | Auto-detected |
| `--yes` | Skip confirmation prompt | `false` |

**Examples:**

```bash
# Basic usage
npx @better-auth/cli@latest generate

# Skip confirmation
npx @better-auth/cli@latest generate --yes

# Custom config path
npx @better-auth/cli@latest generate --config ./src/lib/auth.ts

# Custom output (monorepo)
npx @better-auth/cli@latest generate --output ./packages/database/prisma/schema.prisma --config ./packages/infra.auth/auth.ts
```

### Migrate Command

```bash
npx @better-auth/cli@latest migrate [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--config` | Path to auth config file |
| `--yes` | Skip confirmation |

**Note:** Only works with Kysely adapter. For Prisma, use `prisma migrate dev`.

### Init Command

```bash
npx @better-auth/cli@latest init [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--name` | Application name |
| `--framework` | Framework (currently: Next.js) |
| `--plugins` | Comma-separated plugin list |
| `--database` | Database type (currently: SQLite) |
| `--package-manager` | npm, pnpm, yarn, or bun |

### Secret Command

```bash
npx @better-auth/cli@latest secret
```

Generates a random secret key for `BETTER_AUTH_SECRET`.

### Info Command

```bash
npx @better-auth/cli@latest info [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--config` | Path to auth config file |
| `--json` | Output as JSON |

**Output includes:** System specs, package manager, Better Auth version, detected frameworks, databases, and ORMs.

---

## 4. prisma generate vs @better-auth/cli generate Order

### Critical Sequence

```
1. prisma generate (initial - if custom output configured)
2. @better-auth/cli generate (adds auth models)
3. prisma migrate dev (apply migrations)
4. prisma generate (regenerate with new models)
```

### Why This Order Matters

1. **If you have a custom Prisma client output path** (e.g., `output = "../src/generated/prisma"`), you MUST run `prisma generate` first. Otherwise, the Better Auth CLI will fail with:
   - "Couldn't read your auth config"
   - "@prisma/client did not initialize yet. Please run 'prisma generate' and try to import it again."

2. **Standard setups** (no custom output) can skip the initial `prisma generate`.

### Complete Command Sequence

```bash
# 1. (Optional) Initialize Prisma if needed
npx prisma init

# 2. (Required if custom output) Generate initial Prisma client
npx prisma generate

# 3. Generate Better Auth schema (adds models to schema.prisma)
npx @better-auth/cli@latest generate

# 4. Apply database migrations
npx prisma migrate dev --name add-auth-models

# 5. Regenerate Prisma client with new models
npx prisma generate
```

### Schema Support Status

| Feature | Status |
|---------|--------|
| Prisma Schema Generation | Supported |
| Prisma Schema Migration | NOT Supported (use `prisma migrate`) |

---

## 5. Exact Import Paths

### Server-Side Imports

```typescript
// Core
import { betterAuth } from "better-auth";

// Prisma Adapter
import { prismaAdapter } from "better-auth/adapters/prisma";

// Drizzle Adapter (alternative)
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Next.js Helpers
import { toNextJsHandler } from "better-auth/next-js";
import { nextCookies } from "better-auth/next-js";

// Node.js Handler (for Pages Router)
import { toNodeHandler } from "better-auth/node";

// Cookie Utilities
import { getSessionCookie } from "better-auth/cookies";
```

### Client-Side Imports

```typescript
// React
import { createAuthClient } from "better-auth/react";

// Vue
import { createAuthClient } from "better-auth/vue";

// Svelte
import { createAuthClient } from "better-auth/svelte";

// Solid
import { createAuthClient } from "better-auth/solid";

// Vanilla JavaScript
import { createAuthClient } from "better-auth/client";

// Client Plugins
import { magicLinkClient } from "better-auth/client/plugins";
```

### Prisma Client Import

```typescript
// Standard
import { PrismaClient } from "@prisma/client";

// Custom Output Directory (if configured in schema.prisma)
import { PrismaClient } from "@/generated/prisma/client";
// or
import { PrismaClient } from "../src/generated/prisma/client";
```

---

## 6. Auth Config File Structure

### Complete Configuration Example

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  // Application name
  appName: "My App",

  // Base URL (defaults to BETTER_AUTH_URL env var)
  baseURL: process.env.BETTER_AUTH_URL,

  // Auth routes base path
  basePath: "/api/auth", // default

  // Secret key (defaults to BETTER_AUTH_SECRET env var)
  secret: process.env.BETTER_AUTH_SECRET,

  // Database configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql", // "mysql" | "sqlite"
  }),

  // Trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    "https://myapp.com",
    "https://*.myapp.com", // wildcard support
  ],

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true, // auto sign in after signup
    requireEmailVerification: false,
  },

  // Social providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Email verification
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Send email logic
    },
  },

  // Session configuration
  session: {
    expiresIn: 604800, // 7 days in seconds
    updateAge: 86400, // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 minutes
    },
  },

  // User model customization
  user: {
    modelName: "user", // table name
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 10, // seconds
    max: 100, // requests per window
  },

  // Plugins
  plugins: [
    nextCookies(), // Required for Next.js server actions
  ],

  // Advanced options
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

// Export type for client
export type Auth = typeof auth;
```

### Minimal Configuration

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

---

## 7. Database Schema Details

### Core Tables

Better Auth requires **four core tables**:

#### User Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `name` | String | User's display name |
| `email` | String | Unique email address |
| `emailVerified` | Boolean | Email verification status |
| `image` | String? | Optional profile image URL |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

#### Session Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `userId` | String | Foreign key to User |
| `token` | String | Unique session token |
| `expiresAt` | DateTime | Expiration timestamp |
| `ipAddress` | String? | Client IP address |
| `userAgent` | String? | Client user agent |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

#### Account Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `userId` | String | Foreign key to User |
| `accountId` | String | Provider's account ID |
| `providerId` | String | Auth provider name |
| `accessToken` | String? | OAuth access token |
| `refreshToken` | String? | OAuth refresh token |
| `accessTokenExpiresAt` | DateTime? | Token expiration |
| `refreshTokenExpiresAt` | DateTime? | Refresh token expiration |
| `scope` | String? | OAuth scopes |
| `idToken` | String? | OAuth ID token |
| `password` | String? | Hashed password (for email/password) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

#### Verification Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Primary key |
| `identifier` | String | What's being verified (email, etc.) |
| `value` | String | Verification token |
| `expiresAt` | DateTime | Token expiration |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### Generated Prisma Schema

After running `npx @better-auth/cli generate`, your `prisma/schema.prisma` will include:

```prisma
model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime
  updatedAt  DateTime

  @@map("verification")
}
```

---

## 8. Framework Integration (Next.js)

### App Router Setup

#### API Route Handler

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

#### Server Component Session Access

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

#### Server Action Session Access

```typescript
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function protectedAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Action logic
}
```

### Pages Router Setup

Create `pages/api/auth/[...all].ts`:

```typescript
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default toNodeHandler(auth.handler);
```

### nextCookies Plugin

**Required for Server Actions that set cookies:**

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  // ... other config
  plugins: [nextCookies()],
});
```

### Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

---

## 9. Client Setup

### Client Configuration

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Convenience exports
export const { signIn, signUp, signOut, useSession } = authClient;
```

### Using the Client

#### Sign Up

```typescript
import { authClient } from "@/lib/auth-client";

const handleSignUp = async () => {
  const { data, error } = await authClient.signUp.email({
    email: "user@example.com",
    password: "securepassword",
    name: "John Doe",
    image: "https://example.com/avatar.jpg", // optional
    callbackURL: "/dashboard", // optional redirect
  });

  if (error) {
    console.error(error.message);
    return;
  }

  // User signed up and auto signed in
};
```

#### Sign In

```typescript
import { authClient } from "@/lib/auth-client";

const handleSignIn = async () => {
  const { data, error } = await authClient.signIn.email({
    email: "user@example.com",
    password: "securepassword",
    callbackURL: "/dashboard",
    rememberMe: true, // default: true
  });

  if (error) {
    console.error(error.message);
    return;
  }
};
```

#### Social Sign In

```typescript
import { authClient } from "@/lib/auth-client";

const handleGitHubSignIn = async () => {
  await authClient.signIn.social({
    provider: "github",
    callbackURL: "/dashboard",
    errorCallbackURL: "/sign-in?error=true",
  });
};
```

#### Session Hook (React)

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserButton() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>Not signed in</div>;

  return <div>Hello, {session.user.name}</div>;
}
```

#### Sign Out

```typescript
import { authClient } from "@/lib/auth-client";

const handleSignOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });
};
```

---

## 10. Configuration Options Reference

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appName` | string | - | Application name |
| `baseURL` | string | `BETTER_AUTH_URL` env | Server base URL |
| `basePath` | string | `/api/auth` | Auth routes path |
| `secret` | string | `BETTER_AUTH_SECRET` env | Encryption secret |

### Database Options

| Option | Type | Description |
|--------|------|-------------|
| `database` | object | Database configuration or adapter |
| `secondaryStorage` | object | Redis/KV for sessions |

### Authentication Options

| Option | Type | Description |
|--------|------|-------------|
| `emailAndPassword.enabled` | boolean | Enable email/password auth |
| `emailAndPassword.minPasswordLength` | number | Min password length (default: 8) |
| `emailAndPassword.maxPasswordLength` | number | Max password length (default: 128) |
| `emailAndPassword.autoSignIn` | boolean | Auto sign in after signup |
| `emailAndPassword.requireEmailVerification` | boolean | Require email verification |
| `socialProviders` | object | OAuth provider configs |
| `trustedOrigins` | string[] \| function | Allowed origins |

### Session Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `session.expiresIn` | number | 604800 (7 days) | Session duration in seconds |
| `session.updateAge` | number | 86400 (1 day) | Refresh interval in seconds |
| `session.cookieCache.enabled` | boolean | false | Enable cookie caching |
| `session.cookieCache.maxAge` | number | - | Cache duration in seconds |

### Model Customization

| Option | Description |
|--------|-------------|
| `user.modelName` | Custom table name |
| `user.fields` | Field name mapping |
| `user.additionalFields` | Extra user fields |
| `session.modelName` | Custom table name |
| `account.modelName` | Custom table name |
| `verification.modelName` | Custom table name |

### Rate Limiting

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rateLimit.enabled` | boolean | true (prod) | Enable rate limiting |
| `rateLimit.window` | number | 10 | Window in seconds |
| `rateLimit.max` | number | 100 | Max requests per window |
| `rateLimit.storage` | string | `"memory"` | Storage type |

### Advanced Options

| Option | Type | Description |
|--------|------|-------------|
| `advanced.useSecureCookies` | boolean | HTTPS-only cookies |
| `advanced.disableCSRFCheck` | boolean | Disable CSRF (not recommended) |
| `advanced.database.generateId` | function | Custom ID generator |
| `advanced.database.useNumberId` | boolean | Use numeric IDs |
| `plugins` | array | Plugin array |

---

## 11. Known Issues and Workarounds

### Issue 1: CLI Generate Fails with Default Export

**Error:** "Couldn't read your auth config in ./src/lib/auth.ts"

**Cause:** Using `export default` instead of named export

**Solution:** Use named export:
```typescript
// Use this
export const auth = betterAuth({ ... });

// Not this
export default betterAuth({ ... });
```

### Issue 2: CLI Fails with Custom Prisma Output

**Error:** "@prisma/client did not initialize yet. Please run 'prisma generate' and try to import it again."

**Cause:** Custom output path in `schema.prisma`

**Solution:**
1. Run `npx prisma generate` BEFORE `@better-auth/cli generate`
2. Import Prisma client from custom path:

```typescript
// If schema.prisma has: output = "../src/generated/prisma"
import { PrismaClient } from "@/generated/prisma/client";
```

### Issue 3: CLI Not Finding Auth Config

**Error:** "Couldn't read your auth config"

**Solution:**
1. Ensure file is named `auth.ts`
2. Place in supported location (see File Naming Convention)
3. Use `--config` flag for custom paths:
```bash
npx @better-auth/cli generate --config ./custom/path/auth.ts
```

### Issue 4: Import Aliases Not Working with CLI

**Error:** Module resolution errors

**Solution:** Temporarily replace aliases with relative paths:
```typescript
// Before CLI
import prisma from "@/lib/prisma";

// During CLI (temporarily)
import prisma from "../prisma";

// After CLI, revert to aliases
```

### Issue 5: Cookies Not Set in Server Actions

**Cause:** Server actions require Next.js cookies helper

**Solution:** Add `nextCookies` plugin:
```typescript
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [nextCookies()],
});
```

---

## 12. Complete Code Examples

### Prisma Singleton

`src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Auth Configuration

`src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
```

### Auth Client

`src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### API Route Handler

`src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

### Sign In Page

`src/app/sign-in/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

### Protected Page

`src/app/dashboard/page.tsx`:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Environment Variables

`.env`:

```env
# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Public URL (for client)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Sources

- [Better Auth Official Documentation](https://www.better-auth.com/docs/installation)
- [Better Auth Prisma Adapter](https://www.better-auth.com/docs/adapters/prisma)
- [Better Auth CLI Documentation](https://www.better-auth.com/docs/concepts/cli)
- [Better Auth Database Concepts](https://www.better-auth.com/docs/concepts/database)
- [Better Auth Client Documentation](https://www.better-auth.com/docs/concepts/client)
- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth Options Reference](https://www.better-auth.com/docs/reference/options)
- [Prisma + Better Auth Guide](https://www.prisma.io/docs/guides/betterauth-nextjs)
- [Better Auth GitHub Repository](https://github.com/better-auth/better-auth)
- [@better-auth/cli NPM Package](https://www.npmjs.com/package/@better-auth/cli)

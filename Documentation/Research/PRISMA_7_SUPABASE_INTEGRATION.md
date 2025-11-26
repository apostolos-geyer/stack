# Prisma 7 + Supabase Integration Guide

**Last Updated: November 2025**

This comprehensive guide documents the exact setup for integrating Prisma ORM version 7 with Supabase PostgreSQL, including connection pooling, migrations, and client instantiation.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Supabase Database User Setup](#supabase-database-user-setup)
5. [Connection String Formats](#connection-string-formats)
6. [prisma.config.ts Configuration](#prismaconfigts-configuration)
7. [Schema Configuration](#schema-configuration)
8. [Client Instantiation](#client-instantiation)
9. [Migration Workflow](#migration-workflow)
10. [Singleton Pattern for Next.js](#singleton-pattern-for-nextjs)
11. [Complete Setup Example](#complete-setup-example)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Prisma 7 introduces significant breaking changes from previous versions:

- **Rust-Free Client**: The Prisma Client has been completely rebuilt in TypeScript, eliminating Rust engine binaries
- **New `prisma-client` Provider**: Replaces the deprecated `prisma-client-js` provider
- **Driver Adapters Required**: Database connections now require explicit driver adapters
- **`prisma.config.ts` Required**: Database URL configuration moved from `schema.prisma` to a dedicated config file
- **ESM Migration**: Requires `"type": "module"` in `package.json`
- **`directUrl` Removed**: The `datasource.directUrl` property has been removed from schema files

### Key Benefits

- 90% smaller bundle output
- 3x faster query execution
- Reduced CPU and memory usage
- Simplified edge deployments (Vercel Edge, Cloudflare Workers)

---

## Prerequisites

### Minimum Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 20.19.0+ (22.x recommended) |
| TypeScript | 5.4.0+ (5.9.x recommended) |
| Prisma | 7.0.0+ |

### ESM Configuration

**package.json:**
```json
{
  "type": "module"
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "target": "ES2023",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

---

## Installation

### Core Dependencies

```bash
# Install Prisma CLI as dev dependency
npm install prisma@7 --save-dev

# Install Prisma Client
npm install @prisma/client@7

# Install PostgreSQL driver adapter (REQUIRED for Prisma 7)
npm install @prisma/adapter-pg

# Install dotenv for environment variable management
npm install dotenv

# Optional: Install tsx for seeding
npm install tsx --save-dev
```

### Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Your data model
- `prisma.config.ts` - CLI configuration (new in Prisma 7)
- `.env` - Environment variables

---

## Supabase Database User Setup

### Why Create a Dedicated User?

Creating a dedicated Prisma user provides:
- Better access control and monitoring
- Integration with Supabase Query Performance Dashboard
- Integration with Supabase Log Explorer
- Isolation from default postgres user

### SQL Script

Run this in the **Supabase SQL Editor**:

```sql
-- Create custom Prisma user
-- IMPORTANT: Use a secure password generator for production!
create user "prisma" with password 'YOUR_SECURE_PASSWORD' bypassrls createdb;

-- Extend prisma's privileges to postgres (necessary to view changes in Dashboard)
grant "prisma" to "postgres";

-- Grant necessary permissions on the public schema
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

-- Set default privileges for future objects
alter default privileges for role postgres in schema public
  grant all on tables to prisma;
alter default privileges for role postgres in schema public
  grant all on routines to prisma;
alter default privileges for role postgres in schema public
  grant all on sequences to prisma;
```

### Change Password (if needed)

```sql
alter user "prisma" with password 'NEW_SECURE_PASSWORD';
```

---

## Connection String Formats

Supabase provides **three types of connection strings**. Understanding these is critical for proper setup.

### 1. Direct Database Connection

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

- **Port**: 5432
- **Use Case**: Direct database access, NOT recommended for serverless
- **Note**: IPv6 only by default; requires IPv4 add-on for IPv4 networks

### 2. Session Pooler (Supavisor)

```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

- **Port**: 5432
- **Use Case**: Standard server-based deployments
- **Behavior**: Grants exclusive direct connection to each client
- **Supports**: IPv4 and IPv6

### 3. Transaction Pooler (Supavisor)

```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

- **Port**: 6543
- **Use Case**: Serverless/edge functions, auto-scaling environments
- **Behavior**: Shares connections among multiple clients
- **CRITICAL**: Requires `?pgbouncer=true` parameter

### The `pgbouncer=true` Parameter

**Why is it required?**

- Prisma uses named prepared statements by default
- Transaction mode pooling does NOT support prepared statements
- The `pgbouncer=true` parameter disables Prisma's prepared statements
- Compatible with Supabase's Supavisor pooler

**When to use:**

| Scenario | `pgbouncer=true` Required? |
|----------|---------------------------|
| Transaction pooler (port 6543) | **YES** |
| Session pooler (port 5432) | No |
| Direct connection | No |
| PgBouncer 1.21.0+ | No (optional) |

### Connection String with Custom Prisma User

Using the dedicated prisma user created earlier:

**Session Pooler:**
```
postgres://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Transaction Pooler:**
```
postgres://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## prisma.config.ts Configuration

### Overview

In Prisma 7, `prisma.config.ts` is **required** and replaces:
- The `url` property in the `datasource` block of `schema.prisma`
- The `directUrl` property (completely removed)
- The `prisma` block in `package.json`

### File Location

Place at your project root (same directory as `package.json`):
- `prisma.config.ts` (recommended for small projects)
- `.config/prisma.ts` (recommended for larger projects)

### Basic Configuration

```typescript
// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Schema file location
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  // Database connection for CLI operations (migrations, introspection)
  datasource: {
    url: env('DIRECT_URL'),  // Use direct URL for CLI operations
  },
})
```

### Configuration with Shadow Database

```typescript
// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
    // SQL executed on shadow DB before migrations (optional)
    initShadowDb: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  },

  datasource: {
    url: env('DIRECT_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),  // Optional
  },
})
```

### Alternative: Using `satisfies` Operator

```typescript
// prisma.config.ts
import 'dotenv/config'
import type { PrismaConfig } from 'prisma'
import { env } from 'prisma/config'

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
} satisfies PrismaConfig
```

### Configuration Options Reference

| Option | Type | Required | Default |
|--------|------|----------|---------|
| `schema` | string | No | `./prisma/schema.prisma` |
| `migrations.path` | string | No | none |
| `migrations.seed` | string | No | none |
| `migrations.initShadowDb` | string | No | none |
| `datasource.url` | string | **Yes** | `''` |
| `datasource.shadowDatabaseUrl` | string | No | `''` |

### Important Notes

1. **Paths are relative to the config file**, not the CLI execution directory
2. **Environment variables are NOT auto-loaded** - you must import `dotenv/config`
3. **`directUrl` has been removed** - use `url` in `prisma.config.ts` for CLI operations
4. **CLI commands use `datasource.url`** for migrations and introspection

---

## Schema Configuration

### Prisma 7 Schema Changes

**IMPORTANT**: The `url` property is **removed** from the datasource block in Prisma 7.

```prisma
// prisma/schema.prisma

// Generator - MUST use "prisma-client" (not "prisma-client-js")
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

// Datasource - NO url property in Prisma 7!
datasource db {
  provider = "postgresql"
  // url is configured in prisma.config.ts
  // directUrl has been REMOVED in Prisma 7
}

// Your models
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Key Differences from Prisma 6

| Feature | Prisma 6 | Prisma 7 |
|---------|----------|----------|
| Provider | `prisma-client-js` | `prisma-client` |
| `url` in schema | Required | **REMOVED** |
| `directUrl` in schema | Optional | **REMOVED** |
| Database URL location | `schema.prisma` | `prisma.config.ts` |
| `driverAdapters` preview | Required | **REMOVED** (default) |

---

## Client Instantiation

### Driver Adapter Setup (REQUIRED in Prisma 7)

In Prisma 7, you **must** use driver adapters. The connection string is provided when creating the adapter, NOT in the schema.

### Basic Client Setup

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

// Create the driver adapter with the POOLED connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

// Create Prisma Client with the adapter
export const prisma = new PrismaClient({ adapter })
```

### Environment Variables Setup

```bash
# .env

# Transaction pooler for runtime queries (with pgbouncer=true)
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session pooler or direct connection for CLI operations (migrations)
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Optional: Shadow database for migrations
SHADOW_DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/shadow_db"
```

### Specifying a Custom Schema

```typescript
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL! },
  { schema: 'my_custom_schema' }  // Specify PostgreSQL schema
)

export const prisma = new PrismaClient({ adapter })
```

### Using with Prisma Accelerate

If using Prisma Accelerate for caching and connection pooling:

```typescript
import { PrismaClient } from '../generated/prisma/client.js'
import { withAccelerate } from '@prisma/extension-accelerate'

// No driver adapter needed with Accelerate
const prisma = new PrismaClient().$extends(withAccelerate())
```

---

## Migration Workflow

### Understanding the Two URLs

| Purpose | URL | Why |
|---------|-----|-----|
| **CLI Operations** (migrations, introspection) | `DIRECT_URL` | Requires non-pooled connection |
| **Runtime Queries** | `DATABASE_URL` | Can use pooled connection |

### Initial Migration (New Project)

```bash
# 1. Create and apply migration
npx prisma migrate dev --name init

# 2. Generate Prisma Client
npx prisma generate
```

### Migration for Existing Database

```bash
# 1. Pull existing schema
npx prisma db pull

# 2. Create migrations folder
mkdir -p prisma/migrations/0_init

# 3. Generate migration SQL from schema diff
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 4. Mark migration as applied (don't run it - DB already has these tables)
npx prisma migrate resolve --applied 0_init

# 5. Generate Prisma Client
npx prisma generate
```

### Development Workflow

```bash
# Make changes to schema.prisma, then:
npx prisma migrate dev --name descriptive_name

# This will:
# 1. Create a new migration file
# 2. Apply the migration to your database
# 3. Regenerate Prisma Client
```

### Production Deployment

```bash
# Apply pending migrations (do NOT use migrate dev in production)
npx prisma migrate deploy
```

### Schema Push (Quick Prototyping)

```bash
# Push schema changes directly without migrations
npx prisma db push
```

### Important: Prisma 7 Migration Changes

- `prisma migrate dev` no longer auto-resets the database on drift
- If drift is detected, you'll receive an error with suggested workarounds
- Use `prisma migrate reset` explicitly if you need to reset

---

## Singleton Pattern for Next.js

### Why Is This Needed?

- Next.js hot-reloads files during development
- Each reload can create a new PrismaClient instance
- Multiple instances exhaust database connections
- Each PrismaClient creates its own connection pool

### Implementation

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({ adapter })
}

// Type for global prisma instance
type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

// Use existing instance or create new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development, store on globalThis to persist across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### For Serverless Environments

Add connection limit for serverless:

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const createPrismaClient = () => {
  // Append connection_limit=1 for serverless
  const connectionString = process.env.DATABASE_URL!

  const adapter = new PrismaPg({
    connectionString,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

---

## Complete Setup Example

### Project Structure

```
my-project/
├── package.json
├── tsconfig.json
├── prisma.config.ts          # Prisma CLI configuration
├── .env                      # Environment variables
├── prisma/
│   ├── schema.prisma         # Data model
│   ├── seed.ts               # Seed script
│   └── migrations/           # Migration files
├── generated/
│   └── prisma/
│       └── client/           # Generated Prisma Client
└── src/
    └── lib/
        └── prisma.ts         # Prisma Client singleton
```

### 1. package.json

```json
{
  "name": "my-prisma-supabase-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "dotenv": "^16.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "prisma": "^7.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@prisma/*": ["./generated/prisma/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3. .env

```bash
# Supabase Project Reference (from dashboard)
# Format: [project-ref]

# Transaction Pooler for runtime queries (port 6543)
# MUST include ?pgbouncer=true
DATABASE_URL="postgres://prisma.abcdefghijklmnop:your_secure_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session Pooler for CLI operations (port 5432)
# Used by prisma migrate, prisma db push, etc.
DIRECT_URL="postgres://prisma.abcdefghijklmnop:your_secure_password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

### 4. prisma.config.ts

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Schema location
  schema: 'prisma/schema.prisma',

  // Migration configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  // CLI uses DIRECT_URL (non-pooled) for migrations
  datasource: {
    url: env('DIRECT_URL'),
  },
})
```

### 5. prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // Note: url is NOT set here in Prisma 7
  // It's configured in prisma.config.ts
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 6. src/lib/prisma.ts

```typescript
import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### 7. prisma/seed.ts

```typescript
import { prisma } from '../src/lib/prisma.js'

async function main() {
  console.log('Starting seed...')

  // Create users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: {
          title: 'Hello World',
          content: 'This is my first post!',
          published: true,
        },
      },
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      posts: {
        create: [
          {
            title: 'Draft Post',
            content: 'This is a draft.',
            published: false,
          },
          {
            title: 'Published Post',
            content: 'This is published.',
            published: true,
          },
        ],
      },
    },
  })

  console.log({ alice, bob })
  console.log('Seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

### 8. Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Create Prisma user in Supabase (run SQL from earlier)

# 3. Create and apply initial migration
npx prisma migrate dev --name init

# 4. Seed the database (optional)
npm run prisma:seed

# 5. Open Prisma Studio to view data
npx prisma studio
```

---

## Troubleshooting

### Common Issues

#### 1. "Too many clients already" Error

**Cause**: Connection pool exhaustion

**Solution**:
- Use singleton pattern in Next.js
- Add `connection_limit=1` for serverless
- Use session pooler instead of direct connection

#### 2. "prepared statement does not exist" Error

**Cause**: Using transaction pooler without `pgbouncer=true`

**Solution**:
```bash
# Add pgbouncer=true to transaction pooler URL
DATABASE_URL="postgres://...6543/postgres?pgbouncer=true"
```

#### 3. Migration Fails with Pool Error

**Cause**: Using pooled connection for migrations

**Solution**:
- Ensure `prisma.config.ts` uses `DIRECT_URL` (session pooler or direct)
- Never use port 6543 for `datasource.url` in config

#### 4. "Cannot find module '../generated/prisma/client'"

**Cause**: Prisma Client not generated

**Solution**:
```bash
npx prisma generate
```

#### 5. "prisma.config.ts is required"

**Cause**: Missing config file in Prisma 7

**Solution**: Create `prisma.config.ts` at project root

#### 6. Schema Drift After `migrate reset`

**Cause**: Reset drops all grants including PostgREST permissions

**Solution**: Re-run the user creation SQL script after reset

### Environment Variable Checklist

- [ ] `DATABASE_URL` points to transaction pooler (port 6543) with `?pgbouncer=true`
- [ ] `DIRECT_URL` points to session pooler (port 5432) or direct connection
- [ ] `prisma.config.ts` uses `DIRECT_URL` via `env('DIRECT_URL')`
- [ ] `dotenv/config` is imported at the top of `prisma.config.ts`
- [ ] Password is URL-encoded if it contains special characters

---

## References

### Official Documentation

- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Prisma 7 Release Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0)
- [Supabase Prisma Integration](https://supabase.com/docs/guides/database/prisma)
- [Prisma Supabase Documentation](https://www.prisma.io/docs/orm/overview/databases/supabase)
- [Prisma PgBouncer Configuration](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer)
- [Supabase Connection Management](https://supabase.com/docs/guides/database/connecting-to-postgres)

### Prisma 7 GitHub Resources

- [Prisma 7.0.0 Release](https://github.com/prisma/prisma/releases/tag/7.0.0)
- [Prisma 7 Breaking Changes Discussion](https://github.com/prisma/prisma/issues/28573)
- [@prisma/adapter-pg on npm](https://www.npmjs.com/package/@prisma/adapter-pg)

---

*This guide is current as of November 2025 and reflects Prisma ORM version 7.x*

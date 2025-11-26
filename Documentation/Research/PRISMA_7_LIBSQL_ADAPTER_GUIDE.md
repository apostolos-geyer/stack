# Prisma 7 + @prisma/adapter-libsql for Local SQLite

**Research Date:** November 2025
**Prisma Version:** 7.0.0+
**Target Use Case:** Using `@prisma/adapter-libsql` with local SQLite files (`file:./dev.db`)

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Schema Configuration (schema.prisma)](#schema-configuration-schemaprisma)
4. [Prisma Config File (prisma.config.ts)](#prisma-config-file-prismaconfigts)
5. [Client Instantiation with Adapter](#client-instantiation-with-adapter)
6. [Preview Features Status](#preview-features-status)
7. [Migration Workflow](#migration-workflow)
8. [TypedSQL Support](#typedsql-support)
9. [Timestamp Format Configuration](#timestamp-format-configuration)
10. [Breaking Changes in Prisma 7](#breaking-changes-in-prisma-7)
11. [Complete Working Example](#complete-working-example)

---

## Overview

Prisma 7 introduces a major architectural change: the move to a **Rust-free Prisma Client**. This means:

- Driver adapters are now **required** for all databases (not optional)
- The query compiler (WASM + TypeScript) is the default engine
- Up to **3.4x faster queries** and **90% smaller bundle size** (from ~14MB to 1.6MB)
- `prisma-client-js` generator is deprecated in favor of `prisma-client`

For SQLite, you have two adapter options:
1. `@prisma/adapter-better-sqlite3` - For Node.js environments
2. `@prisma/adapter-libsql` - For Bun, edge runtimes, and Turso compatibility

**Why choose `@prisma/adapter-libsql` for local SQLite?**
- Works with Bun (better-sqlite3 doesn't)
- Compatible with TypedSQL
- Same adapter works for both local development and Turso production
- Future-proof for edge deployments

---

## Installation

```bash
# Install Prisma 7
npm install prisma@7 @prisma/client@7

# Install libSQL adapter and client
npm install @prisma/adapter-libsql @libsql/client

# Install dotenv for environment variable loading (required in Prisma 7)
npm install dotenv
```

---

## Schema Configuration (schema.prisma)

### Prisma 7 Configuration

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
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
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Key Changes from Prisma 6

| Aspect | Prisma 6 | Prisma 7 |
|--------|----------|----------|
| Generator provider | `prisma-client-js` | `prisma-client` |
| Output path | Optional (defaults to node_modules) | **Required** |
| URL in datasource | Required with `url` or `env()` | Moved to `prisma.config.ts` |
| Preview features | `previewFeatures = ["driverAdapters"]` | **Not needed** |

---

## Prisma Config File (prisma.config.ts)

### Basic Configuration

```typescript
// prisma.config.ts (at project root)

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Path to your schema file
  schema: 'prisma/schema.prisma',

  // Migration configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts', // or 'bun prisma/seed.ts'
  },

  // Database URL for CLI operations (migrate, db push, etc.)
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### Environment Variables (.env)

```bash
# .env
DATABASE_URL="file:./dev.db"

# For runtime (optional, can use same as DATABASE_URL for local)
LIBSQL_DATABASE_URL="file:./dev.db"
```

### Important Notes

1. **Environment variables are NOT auto-loaded in Prisma 7** - You must use `import 'dotenv/config'` or load them explicitly
2. **Bun users**: Bun automatically loads `.env` files, so `import 'dotenv/config'` is not needed
3. The `datasource.url` in `prisma.config.ts` overrides any URL in `schema.prisma`

---

## Client Instantiation with Adapter

### Method 1: Direct Adapter Instantiation (Recommended for Prisma 7)

```typescript
// lib/prisma.ts

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

// For local SQLite file
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
  // authToken not needed for local files
})

const prisma = new PrismaClient({ adapter })

export default prisma
```

### Method 2: Using @libsql/client Directly (Alternative)

```typescript
// lib/prisma.ts

import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'
import { resolve } from 'path'

// Create libSQL client for local file
const libsqlClient = createClient({
  url: 'file:' + resolve('./prisma/dev.db'),
})

// Create adapter from client
const adapter = new PrismaLibSql(libsqlClient)

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter })

export default prisma
```

### Method 3: Conditional Local/Remote Setup

```typescript
// lib/prisma.ts

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    // Turso remote database
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
    return new PrismaClient({ adapter })
  } else {
    // Local SQLite file
    const adapter = new PrismaLibSql({
      url: 'file:./prisma/dev.db',
    })
    return new PrismaClient({ adapter })
  }
}

const prisma = createPrismaClient()
export default prisma
```

### Singleton Pattern (for Development Hot Reload)

```typescript
// lib/prisma.ts

import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  })
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

---

## Preview Features Status

### Prisma 7: previewFeatures = ["driverAdapters"] is NO LONGER NEEDED

In Prisma 7:
- `driverAdapters` and `queryCompiler` preview features have been **stabilized**
- They are now the **default behavior**
- You should **remove** these from your `previewFeatures` array

```prisma
// Prisma 6 (OLD - DO NOT USE)
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters", "queryCompiler"]
}

// Prisma 7 (NEW - CORRECT)
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
  // No previewFeatures needed for driver adapters!
}
```

---

## Migration Workflow

### For Local SQLite Development

Prisma Migrate works directly with local SQLite files through the CLI:

```bash
# 1. Create migration
npx prisma migrate dev --name init

# 2. Apply migrations (included in migrate dev)
# Migrations are stored in prisma/migrations/

# 3. Generate client after schema changes
npx prisma generate

# 4. Push schema without migrations (development only)
npx prisma db push

# 5. View/edit data
npx prisma studio
```

### Workflow for Local Dev + Turso Production

Since Turso uses HTTP protocol, `prisma migrate deploy` cannot run directly against it. Use this workflow:

```bash
# 1. Configure prisma.config.ts to point to local SQLite
# datasource: { url: 'file:./dev.db' }

# 2. Generate migration against local SQLite
npx prisma migrate dev --name add_new_feature

# 3. Apply migration to Turso manually using Turso CLI
turso db shell <your-db-name> < ./prisma/migrations/<timestamp>_add_new_feature/migration.sql
```

### Complete Migration Script

```bash
#!/bin/bash
# scripts/migrate.sh

# Load environment
source .env

# Run migration locally
echo "Creating migration..."
npx prisma migrate dev --name "$1"

# If TURSO_DATABASE_URL is set, apply to Turso
if [ -n "$TURSO_DATABASE_URL" ]; then
  echo "Applying to Turso..."
  MIGRATION_DIR=$(ls -td prisma/migrations/*/ | head -1)
  turso db shell your-db-name < "${MIGRATION_DIR}migration.sql"
fi
```

---

## TypedSQL Support

`@prisma/adapter-libsql` **fully supports TypedSQL**, unlike `@prisma/adapter-better-sqlite3`.

### Setup

```prisma
// schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

```typescript
// prisma.config.ts
export default defineConfig({
  // ...
  typedSql: {
    path: 'prisma/sql', // Where your .sql files live
  },
})
```

### Usage

```sql
-- prisma/sql/getUserPosts.sql
SELECT
  p.id,
  p.title,
  p.content,
  u.name as authorName
FROM Post p
JOIN User u ON p.authorId = u.id
WHERE u.id = $1
```

```typescript
import { getUserPosts } from '../generated/prisma/sql'
import prisma from './lib/prisma'

const posts = await getUserPosts(prisma, userId)
```

---

## Timestamp Format Configuration

When migrating from Prisma's native SQLite driver or starting a new project:

```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

// For NEW projects (recommended)
const adapter = new PrismaLibSql(
  { url: 'file:./dev.db' },
  { timestampFormat: 'iso8601' } // Default, best for new projects
)

// For MIGRATING from native Prisma SQLite driver
const adapter = new PrismaLibSql(
  { url: 'file:./dev.db' },
  { timestampFormat: 'unixepoch-ms' } // Maintains compatibility with existing data
)

const prisma = new PrismaClient({ adapter })
```

---

## Breaking Changes in Prisma 7

### 1. Class Name Standardization

| Old Name (Prisma 6) | New Name (Prisma 7) |
|---------------------|---------------------|
| `PrismaLibSQL` | `PrismaLibSql` |
| `PrismaBetterSQLite3` | `PrismaBetterSqlite3` |
| `PrismaD1HTTP` | `PrismaD1Http` |
| `PrismaNeonHTTP` | `PrismaNeonHttp` |

### 2. Removed PrismaClient Options

```typescript
// NO LONGER WORKS in Prisma 7
const prisma = new PrismaClient({
  datasources: { db: { url: '...' } }, // REMOVED
  datasourceUrl: '...', // REMOVED
})

// CORRECT in Prisma 7
const adapter = new PrismaLibSql({ url: '...' })
const prisma = new PrismaClient({ adapter })
```

### 3. Environment Variables Not Auto-Loaded

```typescript
// prisma.config.ts - Must explicitly load env vars
import 'dotenv/config' // ADD THIS
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### 4. Output Path Required

```prisma
// Prisma 7 - output is REQUIRED
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma" // REQUIRED
}
```

---

## Complete Working Example

### File Structure

```
project/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── dev.db              # Local SQLite database
│   └── seed.ts
├── generated/
│   └── prisma/             # Generated Prisma Client
├── src/
│   └── lib/
│       └── prisma.ts
├── prisma.config.ts
├── package.json
├── tsconfig.json
└── .env
```

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
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
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### prisma.config.ts

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### .env

```bash
DATABASE_URL="file:./prisma/dev.db"
```

### src/lib/prisma.ts

```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### prisma/seed.ts

```typescript
import prisma from '../src/lib/prisma'

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      posts: {
        create: {
          title: 'Hello World',
          content: 'This is my first post!',
          published: true,
        },
      },
    },
  })

  console.log({ user })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### package.json (relevant scripts)

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  },
  "dependencies": {
    "@libsql/client": "^0.14.0",
    "@prisma/adapter-libsql": "^7.0.0",
    "@prisma/client": "^7.0.0"
  },
  "devDependencies": {
    "prisma": "^7.0.0",
    "tsx": "^4.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### Usage Example

```typescript
// src/example.ts
import prisma from './lib/prisma'

async function main() {
  // Create a user
  const user = await prisma.user.create({
    data: {
      email: 'alice@prisma.io',
      name: 'Alice',
    },
  })

  // Create a post
  const post = await prisma.post.create({
    data: {
      title: 'Hello Prisma 7!',
      content: 'Using libSQL adapter with local SQLite',
      authorId: user.id,
    },
  })

  // Query with relations
  const userWithPosts = await prisma.user.findUnique({
    where: { id: user.id },
    include: { posts: true },
  })

  console.log(userWithPosts)
}

main()
```

---

## Sources

- [Prisma 7.0.0 Release Notes](https://github.com/prisma/prisma/releases/tag/7.0.0)
- [Upgrade to Prisma ORM 7 Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Database Drivers Documentation](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Prisma SQLite Connector Documentation](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Prisma Turso/libSQL Documentation](https://www.prisma.io/docs/orm/overview/databases/turso)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [@prisma/adapter-libsql on npm](https://www.npmjs.com/package/@prisma/adapter-libsql)
- [Turso + Prisma Documentation](https://docs.turso.tech/sdk/ts/orm/prisma)
- [@libsql/client Documentation](https://github.com/tursodatabase/libsql-client-ts)

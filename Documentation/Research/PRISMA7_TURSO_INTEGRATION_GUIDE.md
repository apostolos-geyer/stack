# Prisma 7 + Turso/LibSQL Cloud Integration Guide

> **Last Updated:** November 2025
> **Prisma Version:** 7.0.0
> **Compatibility:** Node.js 20.19.0+ (22.x recommended), TypeScript 5.4.0+ (5.9.x recommended)

---

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes in Prisma 7](#breaking-changes-in-prisma-7)
3. [Installation](#installation)
4. [Schema Configuration](#schema-configuration)
5. [prisma.config.ts Configuration](#prismaconfigts-configuration)
6. [@prisma/adapter-libsql Setup](#prismaadapter-libsql-setup)
7. [@libsql/client Configuration](#libsqlclient-configuration)
8. [Connection String Format](#connection-string-format)
9. [Auth Token Configuration](#auth-token-configuration)
10. [Migration Workflow](#migration-workflow)
11. [previewFeatures in Prisma 7](#previewfeatures-in-prisma-7)
12. [Embedded Replicas](#embedded-replicas)
13. [Complete Working Example](#complete-working-example)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Prisma 7 represents a major architectural shift from Rust-based to TypeScript-based client generation. This change brings:

- **~90% smaller bundle sizes**
- **Up to 3x faster queries**
- **Significantly lower CPU and memory utilization**
- **Simplified deployments for edge environments (Vercel Edge, Cloudflare Workers)**
- **ESM-first architecture**

Turso is an edge-hosted, distributed database built on libSQL (an open-source fork of SQLite). The combination of Prisma 7 with Turso enables globally distributed, low-latency database access.

---

## Breaking Changes in Prisma 7

### Critical Changes for Migration

| Change | Before (Prisma 6.x) | After (Prisma 7) |
|--------|---------------------|------------------|
| Generator Provider | `prisma-client-js` | `prisma-client` |
| Output Path | Auto (node_modules) | **Required** explicit path |
| Configuration | `schema.prisma` + `package.json` | `prisma.config.ts` **required** |
| Environment Variables | Auto-loaded from `.env` | **Manual loading required** |
| Driver Adapters | Preview feature | **Stable & Required** |
| Module Format | CommonJS default | ESM required |

### Removed Features

- `datasources` and `datasourceUrl` options from PrismaClient constructor
- `directUrl` property from schema configuration
- Client middleware (use Client Extensions instead)
- Metrics preview feature
- Auto-generation into `node_modules`
- Automatic `.env` file loading
- `prisma introspect` command (use `prisma db pull`)

### Adapter Naming Changes (Case Sensitivity)

```typescript
// Old names (Prisma 6.x)
PrismaLibSQL    // Capital SQL

// New names (Prisma 7)
PrismaLibSql    // Lowercase sql
```

---

## Installation

### 1. Install Prisma Packages

```bash
# Using npm
npm install prisma@7 --save-dev
npm install @prisma/client@7

# Using pnpm
pnpm add prisma@7 -D
pnpm add @prisma/client@7

# Using yarn
yarn add prisma@7 --dev
yarn add @prisma/client@7
```

### 2. Install Driver Adapter and LibSQL Client

```bash
# Using npm
npm install @prisma/adapter-libsql @libsql/client

# Using pnpm
pnpm add @prisma/adapter-libsql @libsql/client

# Using yarn
yarn add @prisma/adapter-libsql @libsql/client
```

### 3. Install Environment Variable Loader

```bash
npm install dotenv
```

### 4. Update package.json

Prisma 7 requires ESM module format:

```json
{
  "name": "your-project",
  "type": "module",
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push"
  }
}
```

---

## Schema Configuration

### Prisma 7 Schema (`prisma/schema.prisma`)

```prisma
// =============================================================================
// PRISMA 7 SCHEMA FOR TURSO/LIBSQL
// =============================================================================

generator client {
  // IMPORTANT: Use "prisma-client" NOT "prisma-client-js" for Prisma 7
  provider = "prisma-client"

  // REQUIRED in Prisma 7: Explicit output path
  output   = "../src/generated/prisma"

  // Optional: Target runtime environment
  // Options: nodejs, deno, bun, workerd, vercel-edge, react-native
  // runtime = "nodejs"

  // Optional: Module format (esm is default in Prisma 7)
  // moduleFormat = "esm"

  // Optional: Generated file extension
  // generatedFileExtension = "ts"
}

datasource db {
  // IMPORTANT: Use "sqlite" provider for Turso/LibSQL
  provider = "sqlite"

  // This URL is used ONLY for Prisma CLI commands (migrate, introspect)
  // The actual Turso connection is configured in application code via adapter
  url      = "file:./dev.db"
}

// =============================================================================
// EXAMPLE MODELS
// =============================================================================

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

### Key Points

1. **Generator Provider**: Must be `prisma-client` (not `prisma-client-js`)
2. **Output Path**: Required in Prisma 7 - no more node_modules generation
3. **Datasource Provider**: Use `sqlite` for Turso/LibSQL
4. **URL in Schema**: Used only for local CLI operations, not runtime connection

---

## prisma.config.ts Configuration

### Basic Configuration

Create `prisma.config.ts` in your project root (alongside `package.json`):

```typescript
// prisma.config.ts
import 'dotenv/config'  // REQUIRED: Prisma 7 doesn't auto-load .env
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Schema file location (relative to this config file)
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    // Directory for migration files
    path: 'prisma/migrations',

    // Seed command (optional)
    seed: 'npx tsx prisma/seed.ts',
  },

  // Datasource configuration for CLI commands
  // NOTE: This is used for local migrations, NOT for Turso runtime connection
  datasource: {
    // Local SQLite file for migrations
    url: env('DATABASE_URL') ?? 'file:./prisma/dev.db',

    // Optional: Shadow database for migrations (SQLite usually doesn't need this)
    // shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
})
```

### Advanced Configuration

```typescript
// prisma.config.ts (Advanced)
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',

    // SQL statements to run on shadow database init (optional)
    // initShadowDb: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
  },

  datasource: {
    url: env('DATABASE_URL') ?? 'file:./prisma/dev.db',
  },

  // TypedSQL configuration (optional)
  typedSql: {
    path: 'prisma/sql',
  },

  // Views configuration (optional)
  views: {
    path: 'prisma/views',
  },

  // Experimental features (optional)
  experimental: {
    // Enable externally-managed table support
    // externalTables: true,
  },
})
```

### Alternative: Using TypeScript `satisfies`

```typescript
// prisma.config.ts (Alternative syntax)
import 'dotenv/config'
import type { PrismaConfig } from 'prisma'
import { env } from 'prisma/config'

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL') ?? 'file:./prisma/dev.db',
  },
} satisfies PrismaConfig
```

### Configuration File Locations

Prisma 7 supports these config file names (in order of precedence):

1. `prisma.config.ts` (recommended for small projects)
2. `.config/prisma.ts` (recommended for larger projects)
3. Extensions supported: `.js`, `.ts`, `.mjs`, `.cjs`, `.mts`, `.cts`

---

## @prisma/adapter-libsql Setup

### Basic Adapter Configuration

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'  // Note: PrismaLibSql (not PrismaLibSQL)
import { PrismaClient } from '../generated/prisma'     // Import from your output path

// Create the LibSQL adapter with Turso credentials
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

// Create Prisma Client with the adapter
const prisma = new PrismaClient({ adapter })

export { prisma }
```

### Production-Ready Configuration

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

// Validate environment variables
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required')
}

if (!TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required')
}

// Create adapter with validated credentials
const adapter = new PrismaLibSql({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
})

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### With Logging Configuration

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
})

export { prisma }
```

---

## @libsql/client Configuration

### Direct LibSQL Client Usage (When Needed)

While Prisma 7 uses `@prisma/adapter-libsql` which handles the libSQL client internally, you may sometimes need direct access:

```typescript
// src/lib/libsql.ts
import { createClient } from '@libsql/client'

// For Turso Cloud
export const libsqlClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

// For local development with SQLite file
export const localClient = createClient({
  url: 'file:./prisma/dev.db',
})
```

### With Embedded Replicas

```typescript
// src/lib/libsql-replica.ts
import { createClient } from '@libsql/client'

export const libsqlClient = createClient({
  // Remote Turso database URL
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,

  // Local replica configuration
  syncUrl: process.env.TURSO_DATABASE_URL!,

  // Sync interval in seconds (optional - for automatic sync)
  syncInterval: 60,
})

// Manual sync function
export async function syncReplica() {
  await libsqlClient.sync()
}
```

---

## Connection String Format

### Turso Cloud Connection String

```
libsql://<database-name>-<username>.turso.io
```

### Examples

```bash
# Standard format
TURSO_DATABASE_URL="libsql://my-app-db-johndoe.turso.io"

# With organization
TURSO_DATABASE_URL="libsql://my-app-db-myorg.turso.io"

# Self-hosted libSQL
TURSO_DATABASE_URL="libsql://your-server.example.com:8080"

# Local development (SQLite file)
DATABASE_URL="file:./prisma/dev.db"
```

### URL Schemes

| Scheme | Use Case |
|--------|----------|
| `libsql://` | Turso Cloud (recommended) |
| `https://` | HTTP-based connection |
| `http://` | Local development only |
| `ws://` | WebSocket (local) |
| `wss://` | WebSocket secure |
| `file:` | Local SQLite file |

---

## Auth Token Configuration

### Getting Your Turso Auth Token

```bash
# Login to Turso
turso auth login

# Create a database (if needed)
turso db create my-app-db

# Get database URL
turso db show my-app-db --url

# Create an auth token
turso db tokens create my-app-db

# Create a read-only token (for replicas)
turso db tokens create my-app-db --read-only

# Create a token with expiration
turso db tokens create my-app-db --expiration 7d
```

### Environment Variables

Create a `.env` file:

```bash
# .env

# =============================================================================
# TURSO CLOUD CONFIGURATION
# =============================================================================

# Database URL (libsql:// format)
TURSO_DATABASE_URL="libsql://my-app-db-username.turso.io"

# Auth token from `turso db tokens create`
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."

# =============================================================================
# LOCAL DEVELOPMENT
# =============================================================================

# Local SQLite file for migrations
DATABASE_URL="file:./prisma/dev.db"

# =============================================================================
# OPTIONAL: EMBEDDED REPLICAS
# =============================================================================

# Local replica file path
# TURSO_REPLICA_PATH="./data/local-replica.db"

# Sync interval in seconds
# TURSO_SYNC_INTERVAL="60"
```

### Security Best Practices

```bash
# .gitignore
.env
.env.local
.env.*.local

# Never commit these
prisma/dev.db
prisma/dev.db-journal
*.turso-token
```

---

## Migration Workflow

### Understanding the Limitation

**Important**: Turso uses HTTP to connect, which is incompatible with Prisma Migrate's direct database connection. You must use a local SQLite file for generating migrations, then apply them to Turso manually.

### Step-by-Step Migration Workflow

#### Step 1: Configure Local SQLite for Development

```bash
# .env
DATABASE_URL="file:./prisma/dev.db"
```

```typescript
// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    // Use local SQLite for CLI commands
    url: env('DATABASE_URL') ?? 'file:./prisma/dev.db',
  },
})
```

#### Step 2: Generate Migration Locally

```bash
# Create migration against local SQLite
npx prisma migrate dev --name init

# This creates:
# prisma/migrations/
#   20251121000000_init/
#     migration.sql
```

#### Step 3: Apply Migration to Turso

```bash
# Apply the SQL file to Turso using the CLI
turso db shell my-app-db < ./prisma/migrations/20251121000000_init/migration.sql
```

#### Alternative: Using prisma migrate diff

For generating SQL without applying to local database:

```bash
# Generate SQL diff from empty to current schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script > migration.sql

# Apply to Turso
turso db shell my-app-db < migration.sql
```

#### Subsequent Migrations

```bash
# 1. Make schema changes in schema.prisma

# 2. Generate new migration locally
npx prisma migrate dev --name add_comments_table

# 3. Apply to Turso
turso db shell my-app-db < ./prisma/migrations/20251121120000_add_comments_table/migration.sql
```

### Automated Migration Script

Create a helper script:

```bash
#!/bin/bash
# scripts/migrate-turso.sh

set -e

MIGRATION_NAME=$1
DB_NAME=${TURSO_DB_NAME:-"my-app-db"}

if [ -z "$MIGRATION_NAME" ]; then
  echo "Usage: ./scripts/migrate-turso.sh <migration-name>"
  exit 1
fi

echo "Creating migration: $MIGRATION_NAME"
npx prisma migrate dev --name "$MIGRATION_NAME"

# Find the latest migration folder
LATEST_MIGRATION=$(ls -td prisma/migrations/*/ | head -1)
MIGRATION_SQL="${LATEST_MIGRATION}migration.sql"

if [ -f "$MIGRATION_SQL" ]; then
  echo "Applying migration to Turso: $DB_NAME"
  turso db shell "$DB_NAME" < "$MIGRATION_SQL"
  echo "Migration applied successfully!"
else
  echo "No migration.sql found"
  exit 1
fi
```

### Important Notes on Migrations

1. **No migration tracking on Turso**: The `_prisma_migrations` table won't work reliably
2. **Manual coordination required**: Track which migrations have been applied manually
3. **Test locally first**: Always verify migrations work against local SQLite
4. **Idempotent migrations**: Consider using `IF NOT EXISTS` clauses where possible

---

## previewFeatures in Prisma 7

### Key Change: driverAdapters is Now Stable

In Prisma 7, the `driverAdapters` feature has graduated from preview to stable. **You no longer need to include it in previewFeatures**.

### Prisma 6.x (Old Way)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]  // Required in Prisma 6.x
}
```

### Prisma 7 (New Way)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  // NO previewFeatures needed for driverAdapters!
}
```

### Available Preview Features in Prisma 7

As of Prisma 7, these preview features exist for other functionality:

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  previewFeatures = [
    // Add only if you need these specific features
    // "fullTextSearch",      // Full-text search (PostgreSQL/MySQL)
    // "views",               // Database views support
    // "multiSchema",         // Multi-schema support
    // "postgresqlExtensions" // PostgreSQL extensions
  ]
}
```

---

## Embedded Replicas

### Overview

Turso's embedded replicas create a local SQLite copy of your data for ultra-fast reads (sub-millisecond). Writes are forwarded to the primary database and synced back.

### Configuration with Prisma

```typescript
// src/lib/prisma-with-replica.ts
import { createClient, type Client } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

// Create libSQL client with embedded replica
const libsqlClient: Client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,

  // Enable embedded replica
  syncUrl: process.env.TURSO_DATABASE_URL!,

  // Auto-sync interval (in seconds) - optional
  syncInterval: 60,
})

// Create Prisma adapter using the libSQL client
// Note: In Prisma 7, you can pass options directly to PrismaLibSql
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const prisma = new PrismaClient({ adapter })

// Export sync function for manual sync when needed
export async function syncReplica() {
  await libsqlClient.sync()
}

export { prisma, libsqlClient }
```

### Sync Strategies

#### 1. Automatic Periodic Sync

```typescript
// Configured in client creation
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
  syncInterval: 60, // Sync every 60 seconds
})
```

#### 2. Sync After Write Operations (Using Prisma Extension)

```typescript
// src/lib/prisma-auto-sync.ts
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma'

const libsqlClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
  syncUrl: process.env.TURSO_DATABASE_URL!,
})

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const basePrisma = new PrismaClient({ adapter })

// Extend Prisma Client to auto-sync after mutations
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async create({ args, query }) {
        const result = await query(args)
        await libsqlClient.sync()
        return result
      },
      async update({ args, query }) {
        const result = await query(args)
        await libsqlClient.sync()
        return result
      },
      async delete({ args, query }) {
        const result = await query(args)
        await libsqlClient.sync()
        return result
      },
      async createMany({ args, query }) {
        const result = await query(args)
        await libsqlClient.sync()
        return result
      },
      async updateMany({ args, query }) {
        const result = await query(args)
        await libsqlClient.sync()
        return result
      },
      async deleteMany({ args, query }) {
        const result = await query(args)
        await libsqlClient.sync()
        return result
      },
    },
  },
})
```

#### 3. Middleware-Based Sync (Express/Fastify)

```typescript
// Express middleware example
import express from 'express'
import { libsqlClient } from './lib/prisma-with-replica'

const app = express()

// Sync before each request
app.use(async (req, res, next) => {
  try {
    await libsqlClient.sync()
    next()
  } catch (error) {
    console.error('Sync failed:', error)
    next() // Continue even if sync fails
  }
})
```

---

## Complete Working Example

### Project Structure

```
my-turso-app/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   │   └── 20251121000000_init/
│   │       └── migration.sql
│   └── seed.ts
├── src/
│   ├── generated/
│   │   └── prisma/           # Generated by prisma generate
│   │       ├── client.ts
│   │       ├── index.ts
│   │       └── ...
│   ├── lib/
│   │   └── prisma.ts
│   └── index.ts
├── prisma.config.ts
├── package.json
├── tsconfig.json
└── .env
```

### package.json

```json
{
  "name": "my-turso-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:seed": "npx tsx prisma/seed.ts"
  },
  "dependencies": {
    "@libsql/client": "^0.14.0",
    "@prisma/adapter-libsql": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "prisma": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.9.0"
  },
  "engines": {
    "node": ">=20.19.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "prisma/seed.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### .env

```bash
# Turso Cloud Configuration
TURSO_DATABASE_URL="libsql://my-app-db-username.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."

# Local SQLite for migrations
DATABASE_URL="file:./prisma/dev.db"

# Node environment
NODE_ENV="development"
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
    url: env('DATABASE_URL') ?? 'file:./prisma/dev.db',
  },
})
```

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
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

  @@index([authorId])
}
```

### src/lib/prisma.ts

```typescript
import 'dotenv/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/index.js'

// Validate required environment variables
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required')
}

if (!TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required')
}

// Create the LibSQL adapter for Turso
const adapter = new PrismaLibSql({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
})

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

### src/index.ts

```typescript
import { prisma } from './lib/prisma.js'

async function main() {
  // Create a user
  const user = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  })
  console.log('Created user:', user)

  // Create a post
  const post = await prisma.post.create({
    data: {
      title: 'Hello Turso!',
      content: 'This is my first post using Prisma 7 with Turso.',
      published: true,
      authorId: user.id,
    },
  })
  console.log('Created post:', post)

  // Query with relations
  const users = await prisma.user.findMany({
    include: {
      posts: true,
    },
  })
  console.log('Users with posts:', JSON.stringify(users, null, 2))
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

### prisma/seed.ts

```typescript
import { prisma } from '../src/lib/prisma.js'

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: [
          {
            title: 'My First Post',
            content: 'Hello World!',
            published: true,
          },
          {
            title: 'Draft Post',
            content: 'Work in progress...',
            published: false,
          },
        ],
      },
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
      posts: {
        create: {
          title: "Bob's Blog",
          content: 'Welcome to my blog!',
          published: true,
        },
      },
    },
  })

  console.log('Seeded users:', { alice, bob })
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

### Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Create local migration
npx prisma migrate dev --name init

# 4. Apply migration to Turso
turso db shell my-app-db < ./prisma/migrations/20251121000000_init/migration.sql

# 5. Run seed (optional - seeds to Turso)
npm run db:seed

# 6. Run the application
npm run dev
```

---

## Troubleshooting

### Common Issues

#### 1. "PrismaClient is not a constructor"

**Cause**: Wrong import path after Prisma 7 migration

**Solution**:
```typescript
// Wrong
import { PrismaClient } from '@prisma/client'

// Correct (Prisma 7)
import { PrismaClient } from '../generated/prisma'  // Your output path
```

#### 2. "Environment variables not loaded"

**Cause**: Prisma 7 doesn't auto-load `.env` files

**Solution**:
```typescript
// Add at the top of your entry file and prisma.config.ts
import 'dotenv/config'
```

#### 3. "Cannot find module '../generated/prisma'"

**Cause**: Prisma Client not generated or wrong path

**Solution**:
```bash
npx prisma generate
```

#### 4. "Driver adapter sqlite is not compatible with provider postgres"

**Cause**: Mismatched provider and adapter

**Solution**: Ensure `datasource.provider = "sqlite"` in schema.prisma when using LibSQL adapter

#### 5. "Prisma Migrate not supported"

**Cause**: HTTP connection to Turso doesn't support Prisma Migrate

**Solution**: Use local SQLite for migrations, then apply to Turso:
```bash
npx prisma migrate dev --name my_migration
turso db shell my-db < ./prisma/migrations/[timestamp]_my_migration/migration.sql
```

#### 6. "PrismaLibSQL is not defined" (Naming Issue)

**Cause**: Case sensitivity changed in Prisma 7

**Solution**:
```typescript
// Prisma 6.x
import { PrismaLibSQL } from '@prisma/adapter-libsql'

// Prisma 7
import { PrismaLibSql } from '@prisma/adapter-libsql'  // Lowercase 'sql'
```

### Version Compatibility Matrix

| Package | Minimum Version | Recommended |
|---------|-----------------|-------------|
| `prisma` | 7.0.0 | Latest 7.x |
| `@prisma/client` | 7.0.0 | Latest 7.x |
| `@prisma/adapter-libsql` | 7.0.0 | Latest 7.x |
| `@libsql/client` | 0.8.0+ | Latest |
| Node.js | 20.19.0 | 22.x |
| TypeScript | 5.4.0 | 5.9.x |

---

## References

### Official Documentation

- [Prisma 7 Release Blog](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0)
- [Upgrade to Prisma 7 Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Prisma Turso Documentation](https://www.prisma.io/docs/orm/overview/databases/turso)
- [Prisma Database Drivers](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Prisma SQLite Documentation](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Prisma Generators Reference](https://www.prisma.io/docs/orm/prisma-schema/overview/generators)

### Turso Documentation

- [Turso + Prisma Integration](https://docs.turso.tech/sdk/ts/orm/prisma)
- [Turso Database Documentation](https://docs.turso.tech/)
- [LibSQL Client Documentation](https://docs.turso.tech/libsql)

### Package Registries

- [@prisma/adapter-libsql on npm](https://www.npmjs.com/package/@prisma/adapter-libsql)
- [Prisma GitHub Releases](https://github.com/prisma/prisma/releases)

---

*This guide was created based on research conducted in November 2025 for Prisma 7.0.0 and Turso/LibSQL integration.*

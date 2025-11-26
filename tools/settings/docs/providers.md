# Database Provider Configurations

This document describes the database provider configurations implemented for the Settings CLI tool.

## Overview

The provider configuration system allows the Settings CLI to switch between different database providers by:
1. Managing package dependencies
2. Generating appropriate Prisma client code
3. Configuring environment variables
4. Providing documentation links

## Implementation

### File Structure

```
tools/settings/src/providers/
├── index.ts              # ProviderConfig interface and registry
├── sqlite.ts             # SQLite configuration
├── prisma-postgres.ts    # Prisma Postgres configuration
├── turso.ts              # Turso configuration
├── supabase.ts           # Supabase configuration
└── neon.ts               # Neon configuration
```

### ProviderConfig Interface

Each provider exports a `ProviderConfig` object with the following structure:

```typescript
interface ProviderConfig {
  id: string
  displayName: string
  description: string
  prismaProvider: 'sqlite' | 'postgresql'
  authAdapterProvider: 'sqlite' | 'postgresql'
  dependencies: {
    add: Record<string, string>
    remove: string[]
  }
  localDevOptions: Array<{
    type: 'xdg-file' | 'prisma-dev' | 'docker' | 'supabase-local' | 'remote'
    label: string
    description: string
  }>
  productionEnvVars: Array<{
    name: string
    description: string
    required: boolean
    example: string
  }>
  docs: {
    prisma: string
    provider: string
  }
  templates: {
    clientTs: string  // Only template used - schema is patched, not replaced
  }
  readme: {
    quickstart: string
    troubleshooting: string
  }
}
```

## Provider Implementations

### 1. SQLite (Default)

**Provider:** `sqlite`
**Adapter:** `@prisma/adapter-libsql`
**Prisma Provider:** `sqlite`

Local file-based database, perfect for development and single-machine deployments.

**Dependencies:**
- `@prisma/adapter-libsql: ^7.0.0`

**Environment Variables:**
- `DATABASE_URL` - SQLite file path (e.g., `file:./prod.db`)

**Local Dev Options:**
- XDG file (recommended): `~/.local/share/template-stack/db.sqlite`
- Prisma Dev: Use `prisma migrate dev`

**Client Template:**
```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: serverEnv.DATABASE_URL,
})
```

---

### 2. Prisma Postgres

**Provider:** `prisma-postgres`
**Adapter:** `@prisma/adapter-pg`
**Prisma Provider:** `postgresql`

Prisma's managed PostgreSQL hosting.

**Dependencies:**
- `@prisma/adapter-pg: ^7.0.0`
- `pg: ^8.13.0`

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string

**Local Dev Options:**
- Docker (recommended): Run PostgreSQL in container
- Remote: Connect to Prisma Postgres cloud

**Client Template:**
```typescript
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: serverEnv.DATABASE_URL })
const adapter = new PrismaPg(pool)
```

---

### 3. Turso

**Provider:** `turso`
**Adapter:** `@prisma/adapter-libsql`
**Prisma Provider:** `sqlite`

Distributed SQLite database on Turso's edge network.

**Dependencies:**
- `@prisma/adapter-libsql: ^7.0.0`

**Environment Variables:**
- `TURSO_DATABASE_URL` - Turso database URL (required, e.g., `libsql://your-db.turso.io`)
- `TURSO_AUTH_TOKEN` - Turso authentication token (required)

**Local Dev Options:**
- Remote Turso database (recommended)
- Local SQLite file

**Client Template:**
```typescript
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: serverEnv.TURSO_DATABASE_URL,
  authToken: serverEnv.TURSO_AUTH_TOKEN,
})
```

**Special Notes:**
- Uses different env var names than SQLite (`TURSO_DATABASE_URL` instead of `DATABASE_URL`)
- Requires auth token for remote connections
- Schema provider remains `sqlite` (not a typo!)

---

### 4. Supabase

**Provider:** `supabase`
**Adapter:** `@prisma/adapter-pg`
**Prisma Provider:** `postgresql`

Supabase's managed PostgreSQL with additional features (auth, storage, realtime).

**Dependencies:**
- `@prisma/adapter-pg: ^7.0.0`
- `pg: ^8.13.0`

**Environment Variables:**
- `DATABASE_URL` - Supabase PostgreSQL connection string (should use pooling URL)

**Local Dev Options:**
- Supabase CLI (recommended): Use `supabase start`
- Docker: Run PostgreSQL in container
- Remote: Connect to Supabase cloud

**Client Template:**
```typescript
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: serverEnv.DATABASE_URL })
const adapter = new PrismaPg(pool)
```

**Special Notes:**
- Use connection pooling URL for production (port 6543, not 5432)
- Example: `postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

---

### 5. Neon

**Provider:** `neon`
**Adapter:** `@prisma/adapter-pg` (local) OR `@prisma/adapter-neon` (remote/edge)
**Prisma Provider:** `postgresql`

Serverless PostgreSQL with branching and autoscaling.

**Dependencies:**
- `@prisma/adapter-pg: ^7.0.0` - for local Docker PostgreSQL
- `@prisma/adapter-neon: ^7.0.0` - for remote Neon/edge
- `pg: ^8.13.0`

**Environment Variables:**
- `DATABASE_URL` - Neon PostgreSQL connection string (required)
- `USE_LOCAL_DB` - Set to "true" for local Docker development (optional)

**Local Dev Options:**
- Docker (recommended): Run PostgreSQL in container with `USE_LOCAL_DB=true`
- Remote: Connect to Neon cloud

**Client Template:**
```typescript
// Conditional adapter selection based on USE_LOCAL_DB
const useLocalDb = serverEnv.USE_LOCAL_DB === 'true'

if (useLocalDb) {
  // Standard PostgreSQL adapter for local Docker
  const pool = new Pool({ connectionString: serverEnv.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
} else {
  // Neon adapter for remote/edge
  const adapter = new PrismaNeon({ connectionString: serverEnv.DATABASE_URL })
  return new PrismaClient({ adapter })
}
```

**Special Notes:**
- **Dual adapter support**: Uses `@prisma/adapter-pg` for local Docker PostgreSQL, `@prisma/adapter-neon` for remote Neon
- Selection is based on `USE_LOCAL_DB` environment variable
- No `@neondatabase/serverless` package needed - `@prisma/adapter-neon` handles serverless connections directly

---

## Key Decisions

### 1. Adapter Selection

Each provider uses the most appropriate Prisma adapter:
- **SQLite-based** (SQLite, Turso): `@prisma/adapter-libsql`
- **PostgreSQL-based** (Prisma Postgres, Supabase): `@prisma/adapter-pg`
- **Neon**: Dual adapters - `@prisma/adapter-pg` for traditional, `@prisma/adapter-neon` for edge

### 2. Environment Variables

Each provider defines its required environment variables:
- Most use `DATABASE_URL` as the standard
- **Turso** uses `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to avoid conflicts
- **Neon** adds optional `USE_NEON_EDGE_ADAPTER` for runtime selection

### 3. Template Code Patterns

All templates follow the same pattern from the existing codebase:
```typescript
import { serverEnv } from '@_/platform/server'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  // Adapter-specific code
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (serverEnv.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 4. Local Development Options

Each provider offers context-appropriate local development strategies:
- **File-based** (SQLite): XDG directory, Prisma Dev
- **PostgreSQL-based**: Docker, Prisma Dev, provider-specific CLI
- **Remote-first** (Turso): Remote database recommended for edge features

### 5. Dependency Management

Dependencies are carefully managed to avoid conflicts:
- Each provider lists packages to **add** and packages to **remove**
- Versions use catalog references from `pnpm-workspace.yaml`
- All adapters use `^7.0.0` for consistency with Prisma 7

## Documentation Links

All providers include official documentation:

| Provider | Prisma Docs | Provider Docs |
|----------|-------------|---------------|
| SQLite | https://www.prisma.io/docs/orm/overview/databases/sqlite | (same) |
| Prisma Postgres | https://www.prisma.io/docs/orm/overview/databases/postgresql | (same) |
| Turso | https://www.prisma.io/docs/orm/overview/databases/turso | https://turso.tech/docs |
| Supabase | https://www.prisma.io/docs/orm/overview/databases/supabase | https://supabase.com/docs/guides/database/connecting-to-postgres |
| Neon | https://www.prisma.io/docs/orm/overview/databases/neon | https://neon.tech/docs/introduction |

## Helper Functions

The main `index.ts` exports several helper functions:

```typescript
// Get provider by ID
getProvider(id: string): ProviderConfig | undefined

// Get all provider IDs
getProviderIds(): string[]

// Get all providers as array
getAllProviders(): ProviderConfig[]

// Check if a provider ID is valid
isValidProvider(id: string): boolean

// Get provider choices for CLI prompts
getProviderChoices(): Array<{ name: string; value: string; description: string }>
```

## Usage Example

```typescript
import { getProvider, getProviderChoices } from './providers/index.js'

// Get all providers for a prompt
const choices = getProviderChoices()
// [
//   { name: 'SQLite', value: 'sqlite', description: '...' },
//   { name: 'Neon', value: 'neon', description: '...' },
//   ...
// ]

// Get specific provider config
const config = getProvider('neon')
console.log(config.dependencies.add)
// { '@prisma/adapter-pg': '^7.0.0', ... }

console.log(config.templates.clientTs)
// Full client.ts template code
```

## Issues Encountered

### 1. Neon Dual Adapter Pattern

**Issue:** Neon supports both traditional Node.js (`@prisma/adapter-pg`) and edge runtimes (`@prisma/adapter-neon`).

**Solution:** Implemented conditional adapter selection using dynamic imports and an optional environment variable (`USE_NEON_EDGE_ADAPTER`). This allows users to:
- Use `@prisma/adapter-pg` for local development and traditional Node.js deployments
- Use `@prisma/adapter-neon` for edge deployments (Vercel Edge, Cloudflare Workers, etc.)

**Note:** The template uses top-level `await`, which requires ESM (`"type": "module"` in package.json).

### 2. Turso Environment Variables

**Issue:** Turso requires both a database URL and an auth token, but we want to avoid conflicts with the standard `DATABASE_URL`.

**Solution:** Use dedicated environment variables:
- `TURSO_DATABASE_URL` instead of `DATABASE_URL`
- `TURSO_AUTH_TOKEN` for authentication

This prevents conflicts when developers might have multiple database configurations.

### 3. Package Version Consistency

**Issue:** Need to ensure all adapters use consistent versions with Prisma 7.

**Solution:** All adapter packages use `^7.0.0` version. The `pg` package uses `^8.13.0` (latest stable) as defined in the workspace catalog. The `@neondatabase/serverless` package version was researched and set to `^0.10.5` (current latest).

### 4. Template String Formatting

**Issue:** Need to ensure templates are properly formatted and include correct imports.

**Solution:** All templates:
- Use ES module imports (`.js` extensions)
- Import from `@_/platform/server` for environment variables
- Follow the exact pattern from the existing codebase
- Include proper TypeScript types

## Testing Recommendations

When implementing the Settings CLI tool that uses these configurations:

1. **Dependency Installation**: Test that `add` and `remove` packages are correctly applied
2. **Template Generation**: Verify generated `client.ts` files have correct syntax
3. **Environment Variables**: Ensure `.env.example` files include required variables
4. **Provider Switching**: Test switching between providers doesn't leave orphaned dependencies
5. **Documentation Links**: Verify all URLs are valid and point to correct resources

## Future Enhancements

Potential improvements to consider:

1. **Additional Providers**:
   - PlanetScale
   - CockroachDB
   - MongoDB (when Prisma adapter available)

2. **Validation**:
   - Add schema validation for provider configs
   - Validate environment variable formats

3. **Migration Helpers**:
   - Generate migration scripts when switching providers
   - Handle schema differences between SQLite and PostgreSQL

4. **Better Auth Integration**:
   - Auto-configure Better Auth adapter based on provider
   - Update Better Auth config files

5. **Docker Compose Generation**:
   - Auto-generate `docker-compose.yml` for local PostgreSQL
   - Include pgAdmin or other management tools

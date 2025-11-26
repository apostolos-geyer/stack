import type { ProviderConfig, LocalDevOption, SetupContext, SetupResult } from './index.ts'
import { getLocalSqlitePath } from '../utils/paths.ts'
import { PRISMA_CONFIG_TS } from './templates.ts'
import { input } from '@inquirer/prompts'

/**
 * Turso provider configuration
 *
 * IMPORTANT: Turso requires a two-step migration workflow:
 * 1. Run `prisma migrate dev` against a LOCAL SQLite file (DATABASE_URL)
 * 2. Apply migrations to remote Turso using: `turso db shell <db> < ./prisma/migrations/<name>/migration.sql`
 *
 * The prisma.config.ts uses DATABASE_URL (local file) for migrations.
 * The client.ts uses TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for runtime.
 */
export const turso: ProviderConfig = {
  id: 'turso',
  displayName: 'Turso',
  description: 'Turso distributed SQLite database',
  prismaProvider: 'sqlite',
  authAdapterProvider: 'sqlite',
  dependencies: {
    add: {
      '@prisma/adapter-libsql': '^7.0.0',
    },
    remove: ['@prisma/adapter-pg', '@prisma/adapter-neon', 'pg'],
  },
  localDevOptions: [
    {
      type: 'xdg-file',
      label: 'Local SQLite + Remote Turso',
      description: `Local SQLite for migrations (${getLocalSqlitePath()}), Turso for production`,
      envVars: {
        // DATABASE_URL is auto-populated by db-switch.ts (local SQLite path)
        TURSO_DATABASE_URL: '# Get from: turso db show <db-name> --url',
        TURSO_AUTH_TOKEN: '# Get from: turso db tokens create <db-name>',
        TURSO_DB_NAME: '# Your Turso database name (for CLI migrations)',
      },
      packageJsonScripts: {
        dev: 'prisma studio',
        'db:studio': 'prisma studio',
        'db:migrate:deploy': 'for f in prisma/migrations/*/migration.sql; do echo "Applying $f..." && turso db shell $TURSO_DB_NAME < "$f"; done',
      },
    },
  ],
  productionEnvVars: [
    {
      name: 'TURSO_DATABASE_URL',
      description: 'Turso database URL (libsql://...)',
      required: true,
      example: 'libsql://your-db.turso.io',
    },
    {
      name: 'TURSO_AUTH_TOKEN',
      description: 'Turso authentication token',
      required: true,
      example: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...',
    },
    {
      name: 'TURSO_DB_NAME',
      description: 'Turso database name (for CLI migrations)',
      required: true,
      example: 'my-prod-db',
    },
  ],
  docs: {
    prisma: 'https://www.prisma.io/docs/orm/overview/databases/turso',
    provider: 'https://docs.turso.tech',
  },
  templates: {
    clientTs: `import { serverEnv } from '@_/cfg.env/server'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

/**
 * Creates Prisma client with Turso adapter
 * Uses TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for remote connection
 */
function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: serverEnv.TURSO_DATABASE_URL,
    authToken: serverEnv.TURSO_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (serverEnv.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}`,
    prismaConfigTs: PRISMA_CONFIG_TS,
  },
  readme: {
    quickstart: `## Quick Start

### 1. Set up Turso

\`\`\`bash
# Create a Turso database
turso db create template-dev

# Get your database URL
turso db show template-dev --url

# Create an auth token
turso db tokens create template-dev
\`\`\`

### 2. Configure environment variables

Add to \`.env\`:
\`\`\`bash
# Local SQLite for migrations (required)
DATABASE_URL="file:${getLocalSqlitePath()}"

# Turso credentials for runtime
TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN="your-token-here"
\`\`\`

### 3. Run migrations (two-step process)

\`\`\`bash
# Step 1: Generate migration against local SQLite
pnpm db:migrate:dev --name init

# Step 2: Apply migration to remote Turso
turso db shell template-dev < ./prisma/migrations/20241125000000_init/migration.sql
\`\`\`

> **Note**: Replace \`20241125000000_init\` with your actual migration folder name.`,
    troubleshooting: `## Troubleshooting

**"Cannot migrate" or migration errors**
- Turso doesn't support \`prisma migrate\` directly against remote URLs
- Ensure \`DATABASE_URL\` points to a local SQLite file (\`file:./dev.db\` or XDG path)
- Run migrations locally, then apply SQL to Turso with \`turso db shell\`

**Connection timeout**
- Verify \`TURSO_DATABASE_URL\` starts with \`libsql://\`
- Check that \`TURSO_AUTH_TOKEN\` is valid and not expired
- Run \`turso db list\` to verify the database exists

**"Database not found" error**
- Ensure the URL matches exactly (no trailing slashes)
- Verify you're using the correct database name

**Local dev vs Production**
- Local development uses \`DATABASE_URL\` (local SQLite file)
- Production runtime uses \`TURSO_DATABASE_URL\` + \`TURSO_AUTH_TOKEN\``,
  },

  async setup(_localDevOption: LocalDevOption, ctx: SetupContext): Promise<SetupResult> {
    // Turso uses local SQLite for migrations (DATABASE_URL/DIRECT_URL), remote for runtime (TURSO_* vars)
    const sqliteUrl = `file:${getLocalSqlitePath()}`
    ctx.log.success(`Local SQLite path: ${sqliteUrl}`)

    const envVars: Record<string, string> = {
      DATABASE_URL: sqliteUrl,
      DIRECT_URL: sqliteUrl,
    }

    if (ctx.skipPrompts) {
      // In auto mode, return placeholders for Turso vars
      ctx.log.warn('Skipping prompts - TURSO_* variables will need to be set manually')
      envVars.TURSO_DATABASE_URL = '# Get from: turso db show <db-name> --url'
      envVars.TURSO_AUTH_TOKEN = '# Get from: turso db tokens create <db-name>'
      envVars.TURSO_DB_NAME = '# Your Turso database name (for CLI migrations)'
    } else {
      // Prompt for Turso credentials
      ctx.log.blank()
      ctx.log.info('Turso credentials (get from: turso db show <db-name>)')
      ctx.log.info('Skip these if you want to configure later')
      ctx.log.blank()

      const tursoUrl = await input({
        message: 'TURSO_DATABASE_URL (libsql://...):',
        default: '',
      })
      if (tursoUrl) {
        envVars.TURSO_DATABASE_URL = tursoUrl
      } else {
        envVars.TURSO_DATABASE_URL = '# Get from: turso db show <db-name> --url'
      }

      const tursoToken = await input({
        message: 'TURSO_AUTH_TOKEN:',
        default: '',
      })
      if (tursoToken) {
        envVars.TURSO_AUTH_TOKEN = tursoToken
      } else {
        envVars.TURSO_AUTH_TOKEN = '# Get from: turso db tokens create <db-name>'
      }

      const tursoDbName = await input({
        message: 'TURSO_DB_NAME (for CLI migrations):',
        default: '',
      })
      if (tursoDbName) {
        envVars.TURSO_DB_NAME = tursoDbName
      } else {
        envVars.TURSO_DB_NAME = '# Your Turso database name'
      }

      ctx.log.success('Turso configuration complete')
    }

    return { envVars }
  },
}

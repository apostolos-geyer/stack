import type { ProviderConfig, LocalDevOption, SetupContext, SetupResult } from './index.ts'
import { PRISMA_CONFIG_TS, NOOP_SCRIPT } from './templates.ts'
import { input } from '@inquirer/prompts'

/**
 * Neon serverless PostgreSQL provider configuration
 *
 * Neon is always remote - uses @prisma/adapter-neon for edge-compatible connections.
 * User must provide DATABASE_URL and DIRECT_URL from their Neon dashboard.
 */
export const neon: ProviderConfig = {
  id: 'neon',
  displayName: 'Neon',
  description: 'Neon serverless PostgreSQL database',
  prismaProvider: 'postgresql',
  authAdapterProvider: 'postgresql',
  dependencies: {
    add: {
      '@prisma/adapter-neon': '^7.0.0',
    },
    remove: ['@prisma/adapter-libsql', '@prisma/adapter-pg', 'pg'],
  },
  scripts: {
    'db:migrate:deploy': 'prisma migrate deploy',
  },
  localDevOptions: [
    {
      type: 'remote',
      label: 'Neon Cloud',
      description: 'Connect to Neon cloud database (free tier available)',
      envVars: {
        DATABASE_URL: '# Get from Neon dashboard (pooled connection)',
        DIRECT_URL: '# Get from Neon dashboard (direct connection)',
      },
      packageJsonScripts: {
        // Neon is remote-only, no server to start/stop
        dev: 'prisma studio',
        'db:start': NOOP_SCRIPT,
        'db:stop': NOOP_SCRIPT,
      },
    },
  ],
  productionEnvVars: [
    {
      name: 'DATABASE_URL',
      description: 'Neon PostgreSQL pooled connection string',
      required: true,
      example: 'postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require',
    },
    {
      name: 'DIRECT_URL',
      description: 'Neon PostgreSQL direct connection string (for migrations)',
      required: true,
      example: 'postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require',
    },
  ],
  docs: {
    prisma: 'https://www.prisma.io/docs/orm/overview/databases/neon',
    provider: 'https://neon.tech/docs/introduction',
  },
  templates: {
    clientTs: `import { serverEnv } from '@_/platform/server'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

/**
 * Creates Prisma client with Neon adapter
 * Always uses @prisma/adapter-neon for edge-compatible serverless connections
 */
function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: serverEnv.DATABASE_URL })
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

1. Create a Neon project at https://neon.tech (free tier available)
2. Copy the connection strings from your Neon dashboard to \`.env\`
3. Run migrations: \`pnpm db:migrate:dev --name init\`
4. Start your app: \`pnpm dev\`

### Getting Connection Strings

From your Neon dashboard:
- **DATABASE_URL**: Use the "Pooled connection" string
- **DIRECT_URL**: Use the "Direct connection" string (for migrations)`,
    troubleshooting: `## Troubleshooting

**Connection timeout on edge functions**
- Neon connections may cold start; this is normal for serverless
- Consider using connection pooling for production

**Migration errors with pooled connection**
- Ensure DIRECT_URL is set to the direct (non-pooled) connection string
- Migrations require direct connections, not pooled ones

**"Invalid connection string" error**
- Ensure you copied the full connection string including \`?sslmode=require\``,
  },

  async setup(_localDevOption: LocalDevOption, ctx: SetupContext): Promise<SetupResult> {
    ctx.log.info('Neon requires connection strings from your Neon dashboard')
    ctx.log.blank()

    const envVars: Record<string, string> = {}

    if (ctx.skipPrompts) {
      // In auto mode, return placeholders
      ctx.log.warn('Skipping prompts - DATABASE_URL and DIRECT_URL will need to be set manually')
      envVars.DATABASE_URL = '# Get from Neon dashboard (pooled connection)'
      envVars.DIRECT_URL = '# Get from Neon dashboard (direct connection)'
    } else {
      // Prompt for connection strings
      ctx.log.info('Get these from your Neon dashboard: https://console.neon.tech')
      ctx.log.blank()

      const databaseUrl = await input({
        message: 'DATABASE_URL (pooled connection):',
        validate: (val) => {
          if (!val || val.trim() === '') {
            return 'DATABASE_URL is required'
          }
          if (!val.includes('neon.tech')) {
            return 'Expected a Neon connection string (should contain neon.tech)'
          }
          return true
        },
      })
      envVars.DATABASE_URL = databaseUrl

      const directUrl = await input({
        message: 'DIRECT_URL (direct connection for migrations):',
        validate: (val) => {
          if (!val || val.trim() === '') {
            return 'DIRECT_URL is required'
          }
          return true
        },
      })
      envVars.DIRECT_URL = directUrl

      ctx.log.success('Neon connection strings configured')
    }

    return { envVars }
  },
}

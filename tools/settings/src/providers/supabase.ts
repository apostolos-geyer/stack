import type { ProviderConfig, LocalDevOption, SetupContext, SetupResult } from './index.ts'
import { SYSTEM_DEPS } from '../utils/system-deps.ts'
import { PG_CLIENT_TS, PRISMA_CONFIG_TS } from './templates.ts'
import { setupSupabase } from '../utils/supabase.ts'

/**
 * Supabase provider configuration
 *
 * Uses Supabase CLI (`supabase start`) for local development.
 * The CLI will auto-start Supabase if not already running.
 */
export const supabase: ProviderConfig = {
  id: 'supabase',
  displayName: 'Supabase',
  description: 'Supabase with local development stack',
  prismaProvider: 'postgresql',
  authAdapterProvider: 'postgresql',
  dependencies: {
    add: {
      '@prisma/adapter-pg': '^7.0.0',
      pg: '^8.13.0',
    },
    remove: ['@prisma/adapter-libsql', '@prisma/adapter-neon'],
  },
  scripts: {
    'db:migrate:deploy': 'prisma migrate deploy',
  },
  localDevOptions: [
    {
      type: 'supabase-local',
      label: 'Supabase Local',
      description: 'Local Supabase stack (auto-configured from supabase status)',
      envVars: {
        // DATABASE_URL and DIRECT_URL are auto-captured from `supabase status` by db-switch.ts
      },
      packageJsonScripts: {
        dev: 'supabase start && prisma studio',
        'db:start': 'supabase start',
        'db:stop': 'supabase stop',
      },
      systemDeps: [SYSTEM_DEPS.docker, SYSTEM_DEPS.supabase],
    },
  ],
  productionEnvVars: [
    {
      name: 'DATABASE_URL',
      description: 'Supabase PostgreSQL pooled connection string (port 6543)',
      required: true,
      example: 'postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
    },
    {
      name: 'DIRECT_URL',
      description: 'Supabase PostgreSQL direct connection string (port 5432)',
      required: true,
      example: 'postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres',
    },
  ],
  docs: {
    prisma: 'https://www.prisma.io/docs/orm/overview/databases/supabase',
    provider: 'https://supabase.com/docs/guides/cli/local-development',
  },
  templates: {
    clientTs: PG_CLIENT_TS,
    prismaConfigTs: PRISMA_CONFIG_TS,
  },
  readme: {
    quickstart: `## Quick Start

### Prerequisites
- Install Supabase CLI: \`npm install -g supabase\`
- Docker must be running

### Local Development
1. Initialize (first time only): \`supabase init\`
2. Start local stack: \`pnpm db:start\`
3. Run migrations: \`pnpm db:migrate:dev --name init\`
4. Open Prisma Studio: \`pnpm db:studio\`

The local Supabase stack includes PostgreSQL, Auth, Storage, and more.`,
    troubleshooting: `## Troubleshooting

**"supabase: command not found"**
- Install Supabase CLI: \`npm install -g supabase\`

**Docker errors**
- Ensure Docker Desktop is running
- Try: \`supabase stop && supabase start\`

**Port conflicts**
- Default PostgreSQL port is 54322 (not 5432)
- Stop other PostgreSQL instances if needed

**Connection pooler errors (production)**
- Use port 5432 for DIRECT_URL (direct connection)
- Use port 6543 for DATABASE_URL (pooled connection)`,
  },

  async setup(_localDevOption: LocalDevOption, ctx: SetupContext): Promise<SetupResult> {
    ctx.log.info('Setting up Supabase local stack...')

    try {
      const { databaseUrl } = await setupSupabase()
      ctx.log.success('Captured connection string from Supabase')

      return {
        envVars: {
          DATABASE_URL: databaseUrl,
          DIRECT_URL: databaseUrl,
        },
      }
    } catch (error) {
      ctx.log.warn(
        `Supabase setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      ctx.log.warn('DATABASE_URL and DIRECT_URL will need to be set manually')
      return { envVars: {} }
    }
  },
}

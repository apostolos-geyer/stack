import type { ProviderConfig, LocalDevOption, SetupContext, SetupResult } from './index.ts'
import { getLocalSqlitePath } from '../utils/paths.ts'
import { PRISMA_CONFIG_TS } from './templates.ts'

export const sqlite: ProviderConfig = {
  id: 'sqlite',
  displayName: 'SQLite',
  description: 'Local SQLite database using libsql adapter',
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
      label: 'XDG file (recommended)',
      description: `Store database in ${getLocalSqlitePath()} (auto-configured)`,
      envVars: {
        // DATABASE_URL is auto-populated by db-switch.ts
      },
      packageJsonScripts: {
        dev: 'prisma studio',
        'db:studio': 'prisma studio',
      },
    },
  ],
  productionEnvVars: [
    {
      name: 'DATABASE_URL',
      description: 'SQLite file path or libsql URL',
      required: true,
      example: 'file:./prod.db',
    },
  ],
  docs: {
    prisma: 'https://www.prisma.io/docs/orm/overview/databases/sqlite',
    provider: 'https://www.prisma.io/docs/orm/overview/databases/sqlite',
  },
  templates: {
    clientTs: `import { serverEnv } from '@_/cfg.env/server'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: serverEnv.DATABASE_URL,
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

1. The database file is stored at \`${getLocalSqlitePath()}\` (XDG-compliant)
2. Run migrations: \`pnpm db:migrate:dev --name init\`
3. Open Prisma Studio: \`pnpm db:studio\``,
    troubleshooting: `## Troubleshooting

**Database file not found**
- Ensure DATABASE_URL is set to \`file:${getLocalSqlitePath()}\`
- The directory will be created automatically on first migration

**Permission errors**
- Check that the parent directory exists and is writable`,
  },

  async setup(_localDevOption: LocalDevOption, ctx: SetupContext): Promise<SetupResult> {
    const sqliteUrl = `file:${getLocalSqlitePath()}`
    ctx.log.success(`SQLite path: ${sqliteUrl}`)

    return {
      envVars: {
        DATABASE_URL: sqliteUrl,
        DIRECT_URL: sqliteUrl,
      },
    }
  },
}

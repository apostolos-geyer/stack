/**
 * Shared templates for database providers
 * Reduces duplication across provider configurations
 */

/**
 * Standard prisma.config.ts template
 * Used by all providers - migrations always use DIRECT_URL
 */
export const PRISMA_CONFIG_TS = `import path from 'node:path'
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(import.meta.dirname, 'prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
})`;

/**
 * PostgreSQL client template using @prisma/adapter-pg
 * Used by: postgres, prisma-postgres, supabase
 */
export const PG_CLIENT_TS = `import { serverEnv } from '@_/platform/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: serverEnv.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (serverEnv.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}`;

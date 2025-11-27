console.log("[TRACE] @_/infra.db/client - START", Date.now());
import { serverEnv } from '@_/platform/server'
console.log("[TRACE] @_/infra.db/client - after platform/server", Date.now());
import { PrismaPg } from '@prisma/adapter-pg'
console.log("[TRACE] @_/infra.db/client - after prisma adapter", Date.now());
import { PrismaClient } from './generated/prisma/client'
console.log("[TRACE] @_/infra.db/client - after PrismaClient", Date.now());

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: serverEnv.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (serverEnv.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
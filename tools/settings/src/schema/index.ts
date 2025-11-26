/**
 * Schema management utilities
 * @description Provides tools for managing Prisma schema changes, including:
 * - Running Better Auth CLI to generate auth models
 * - Patching schema.prisma for different database providers
 * - Ensuring Prisma 7 compatibility
 * - User approval workflow for all schema changes
 *
 * @module schema
 */

// Better Auth integration
export {
  runBetterAuthGenerate,
  hasBetterAuthModels,
  type BetterAuthResult,
} from './better-auth.ts'

// Schema patching utilities
export {
  patchSchemaForProvider,
  updateDatasourceProvider,
  ensurePrisma7Generator,
  removeDatasourceUrl,
  type DatabaseProvider,
  type PatchResult,
  type PatchSchemaOptions,
} from './patch.ts'

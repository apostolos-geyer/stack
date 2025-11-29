/**
 * @fileoverview Environment management utilities
 * @description Comprehensive environment variable and configuration management for the monorepo.
 * Provides utilities for:
 * - Generating and parsing .env files
 * - Managing Zod schema in platform package
 * - Syncing turbo.json globalEnv configuration
 * - Creating and managing .env symlinks across packages
 *
 * @example
 * ```typescript
 * import {
 *   generateEnvContent,
 *   syncTurboEnv,
 *   createSymlinks,
 *   getSymlinkStatus
 * } from './env/index.ts';
 *
 * // Generate .env content
 * const content = generateEnvContent({
 *   DATABASE_URL: "postgresql://localhost:5432/db"
 * });
 *
 * // Sync turbo.json with platform
 * const result = await syncTurboEnv();
 * console.log(`Added ${result.added.length} vars`);
 *
 * // Create symlinks
 * await createSymlinks(".env.local", ["apps/web", "packages/db"]);
 * ```
 */

// Generator - .env file content generation
export {
  generateEnvContent,
  parseEnvContent,
  mergeEnvContent,
} from "./generator.ts";

// platform - Zod schema management
export {
  addEnvVarsToSchema,
  removeEnvVarsFromSchema,
  extractEnvVarNames,
  updateCfgEnvForProvider,
  getProviderEnvVarNames,
  ALL_DB_ENV_VARS,
  PROVIDER_ENV_VARS,
  type EnvVarDefinition,
} from "./cfg-env.ts";

// turbo.json - globalEnv synchronization
export {
  getGlobalEnv,
  syncTurboEnv,
  setGlobalEnv,
  type SyncResult,
} from "./turbo-json.ts";

// Symlinks - .env symlink management
export {
  discoverEnvFiles,
  discoverPackages,
  createSymlinks,
  getSymlinkStatus,
  removeSymlinks,
  type SymlinkResult,
  type SymlinkStatus,
} from "./symlinks.ts";

// Env templates - Generate complete .env files from schema
export {
  parseEnvSchema,
  generateEnv,
  checkMissingEnvVars,
  generateSecret,
  ENV_VAR_DEFAULTS,
  type ParsedEnvVar,
} from "./env-template.ts";

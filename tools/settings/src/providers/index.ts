/**
 * Database provider configurations for the Settings CLI
 *
 * Each provider defines:
 * - Dependencies to install/remove
 * - Prisma client adapter code templates
 * - Environment variable requirements
 * - Local development setup options
 * - Documentation links
 * - Setup function to derive/prompt for env vars
 */

import type { SystemDependency } from '../utils/system-deps.ts'
import type { log as logType } from '../utils/logger.ts'

/** Local development option type */
export type LocalDevType = 'xdg-file' | 'prisma-dev' | 'docker' | 'supabase-local' | 'remote'

/** Local development option configuration */
export interface LocalDevOption {
  /** Type of local development setup */
  type: LocalDevType
  /** Short label for the option */
  label: string
  /** Detailed description */
  description: string
  /** Base environment variables (placeholders) for this option */
  envVars: Record<string, string>
  /** Scripts to add to packages/infra.db/package.json */
  packageJsonScripts: Record<string, string>
  /** Required system dependencies (e.g., docker, supabase CLI) */
  systemDeps?: SystemDependency[]
}

/** Context passed to provider setup function */
export interface SetupContext {
  /** Logger for user feedback */
  log: typeof logType
  /** Skip interactive prompts (auto-mode) */
  skipPrompts: boolean
}

/** Result from provider setup */
export interface SetupResult {
  /** Environment variables to merge into .env */
  envVars: Record<string, string>
}

export interface ProviderConfig {
  /** Unique identifier for the provider */
  id: string

  /** Display name shown in CLI prompts */
  displayName: string

  /** Brief description of the provider */
  description: string

  /** Prisma schema provider type */
  prismaProvider: 'sqlite' | 'postgresql'

  /** Better-auth adapter provider type */
  authAdapterProvider: 'sqlite' | 'postgresql'

  /** Package dependencies */
  dependencies: {
    /** Packages to add with their versions */
    add: Record<string, string>
    /** Packages to remove */
    remove: string[]
  }

  /** Local development environment options with env vars and scripts */
  localDevOptions: LocalDevOption[]

  /** Production environment variables (for README and prompts) */
  productionEnvVars: Array<{
    /** Environment variable name */
    name: string
    /** Description of what this variable is for */
    description: string
    /** Whether this variable is required */
    required: boolean
    /** Example value */
    example: string
  }>

  /** Documentation URLs */
  docs: {
    /** Prisma documentation for this database */
    prisma: string
    /** Provider-specific documentation */
    provider: string
  }

  /** Code templates */
  templates: {
    /** Template for src/client.ts */
    clientTs: string
    /** Template for prisma.config.ts (providers with DIRECT_URL need custom config) */
    prismaConfigTs: string
    /** Optional docker-compose.yml for providers that use Docker */
    dockerComposeYml?: string
  }

  /** README content for packages/infra.db/README.md */
  readme: {
    /** Quick start instructions */
    quickstart: string
    /** Common issues and solutions */
    troubleshooting: string
  }

  /**
   * Provider setup function - derives/prompts for environment variables.
   * Called during db:switch to populate DATABASE_URL, DIRECT_URL, etc.
   *
   * @param localDevOption - The selected local development option
   * @param ctx - Setup context with logger and options
   * @returns Environment variables to merge into .env
   */
  setup: (localDevOption: LocalDevOption, ctx: SetupContext) => Promise<SetupResult>
}

import { sqlite } from './sqlite.ts'
import { prismaPostgres } from './prisma-postgres.ts'
import { turso } from './turso.ts'
import { supabase } from './supabase.ts'
import { neon } from './neon.ts'
import { postgres } from './postgres.ts'

/** All available database providers */
export const PROVIDERS: Record<string, ProviderConfig> = {
  sqlite,
  'prisma-postgres': prismaPostgres,
  postgres,
  turso,
  supabase,
  neon,
}

/** Get provider by ID */
export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS[id]
}

/** Get all provider IDs */
export function getProviderIds(): string[] {
  return Object.keys(PROVIDERS)
}

/** Get all providers as array */
export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS)
}

/** Check if a provider ID is valid */
export function isValidProvider(id: string): boolean {
  return id in PROVIDERS
}

/** Get provider display names for CLI prompts */
export function getProviderChoices(): Array<{ name: string; value: string; description: string }> {
  return getAllProviders().map((p) => ({
    name: p.displayName,
    value: p.id,
    description: p.description,
  }))
}

import { execSync } from 'node:child_process'
import { log } from './logger.ts'

export interface SystemDependency {
  /** Command to check (e.g., 'docker', 'supabase') */
  command: string
  /** Human-readable name */
  name: string
  /** Why this dependency is needed */
  reason: string
  /** Installation instructions */
  installInstructions: string
}

/**
 * Check if a command exists on the system
 * @param command - Command to check
 * @returns true if command exists, false otherwise
 */
export function commandExists(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Check a single system dependency
 * @param dep - Dependency to check
 * @returns Object with exists flag and dependency info
 */
export function checkSystemDependency(dep: SystemDependency): {
  exists: boolean
  dependency: SystemDependency
} {
  return {
    exists: commandExists(dep.command),
    dependency: dep,
  }
}

/**
 * Check multiple system dependencies
 * @param deps - Array of dependencies to check
 * @returns Object with all results and missing dependencies
 */
export function checkSystemDependencies(deps: SystemDependency[]): {
  allSatisfied: boolean
  missing: SystemDependency[]
  results: Array<{ exists: boolean; dependency: SystemDependency }>
} {
  const results = deps.map((dep) => checkSystemDependency(dep))
  const missing = results.filter((r) => !r.exists).map((r) => r.dependency)

  return {
    allSatisfied: missing.length === 0,
    missing,
    results,
  }
}

/**
 * Ensure all system dependencies are installed, or throw with instructions
 * @param deps - Array of dependencies to check
 * @throws Error if any dependencies are missing
 */
export function ensureSystemDependencies(deps: SystemDependency[]): void {
  const { allSatisfied, missing } = checkSystemDependencies(deps)

  if (allSatisfied) {
    log.success('All system dependencies satisfied')
    return
  }

  log.error('Missing required system dependencies:')
  log.blank()

  for (const dep of missing) {
    log.error(`  ✗ ${dep.name} (${dep.command})`)
    log.info(`    Why: ${dep.reason}`)
    log.info(`    Install: ${dep.installInstructions}`)
    log.blank()
  }

  throw new Error(
    `Missing system dependencies: ${missing.map((d) => d.name).join(', ')}. ` +
      'Please install them and try again.'
  )
}

// Common system dependencies used by providers
export const SYSTEM_DEPS = {
  docker: {
    command: 'docker',
    name: 'Docker',
    reason: 'Required to run PostgreSQL in a container',
    installInstructions:
      'https://docs.docker.com/get-docker/ (or try https://orbstack.dev for a lighter experience on Mac)',
  },
  dockerCompose: {
    command: 'docker',
    name: 'Docker Compose',
    reason: 'Required to manage the PostgreSQL container',
    installInstructions:
      'Docker Compose is included with Docker Desktop (https://docs.docker.com/get-docker/) or OrbStack (https://orbstack.dev)',
  },
  supabase: {
    command: 'supabase',
    name: 'Supabase CLI',
    reason: 'Required to run the local Supabase development stack',
    installInstructions:
      'npm install -g supabase or brew install supabase/tap/supabase',
  },
} as const satisfies Record<string, SystemDependency>

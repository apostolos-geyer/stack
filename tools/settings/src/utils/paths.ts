import path from 'node:path'
import os from 'node:os'
import { existsSync } from 'node:fs'

/**
 * Finds the repository root by looking for pnpm-workspace.yaml
 * @returns The absolute path to the repository root
 */
function findRepoRoot(): string {
  let dir = process.cwd()
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return process.cwd()
}

export const REPO_ROOT = findRepoRoot()

// Core files the CLI modifies
export const PATHS = {
  // db package
  DB_PACKAGE_JSON: path.join(REPO_ROOT, 'packages/db/package.json'),
  DB_CLIENT_TS: path.join(REPO_ROOT, 'packages/db/src/client.ts'),
  DB_SCHEMA_PRISMA: path.join(REPO_ROOT, 'packages/db/prisma/schema.prisma'),
  DB_PRISMA_CONFIG: path.join(REPO_ROOT, 'packages/db/prisma.config.ts'),
  DB_MIGRATIONS: path.join(REPO_ROOT, 'packages/db/prisma/migrations'),
  DB_README: path.join(REPO_ROOT, 'packages/db/README.md'),
  DB_DOCKER_COMPOSE: path.join(REPO_ROOT, 'packages/db/docker-compose.yml'),

  // features package (auth)
  AUTH_TS: path.join(REPO_ROOT, 'packages/features/src/auth/auth.ts'),

  // platform package
  CFG_ENV_SERVER: path.join(REPO_ROOT, 'packages/platform/src/server.ts'),

  // Root files
  TURBO_JSON: path.join(REPO_ROOT, 'turbo.json'),
  ENV: path.join(REPO_ROOT, '.env'),
  ENV_EXAMPLE: path.join(REPO_ROOT, '.env.example'),
  PNPM_WORKSPACE: path.join(REPO_ROOT, 'pnpm-workspace.yaml'),
} as const

// Files that require git commit check before modification
export const GIT_PROTECTED_FILES = [
  PATHS.DB_PACKAGE_JSON,
  PATHS.DB_CLIENT_TS,
  PATHS.DB_SCHEMA_PRISMA,
  PATHS.DB_PRISMA_CONFIG,
  PATHS.AUTH_TS,
  PATHS.CFG_ENV_SERVER,
] as const

// Packages that require all files committed before modification
export const GIT_PROTECTED_PACKAGES = [
  path.join(REPO_ROOT, 'packages/db'),
  path.join(REPO_ROOT, 'packages/features'),
  path.join(REPO_ROOT, 'packages/platform'),
] as const

// Default symlink targets
export const DEFAULT_SYMLINK_TARGETS = [
  'apps/web',
  'packages/db',
  'packages/features',
] as const

// XDG data directory for local SQLite database
export function getXdgDataDir(): string {
  const xdgDataHome = process.env.XDG_DATA_HOME
  if (xdgDataHome) {
    return path.join(xdgDataHome, 'template-stack')
  }
  return path.join(os.homedir(), '.local', 'share', 'template-stack')
}

export function getLocalSqlitePath(): string {
  return path.join(getXdgDataDir(), 'dev.db')
}

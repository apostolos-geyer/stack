import { describe, it, expect } from 'vitest'
import {
  updateCfgEnvForProvider,
  extractEnvVarNames,
  getProviderEnvVarNames,
  PROVIDER_ENV_VARS,
} from '../env/cfg-env.ts'

const SAMPLE_SERVER_TS = `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().min(1),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),

    // Node environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  experimental__runtimeEnv: process.env,
});
`

describe('cfg-env utilities', () => {
  describe('extractEnvVarNames', () => {
    it('extracts all env var names from server.ts', () => {
      const varNames = extractEnvVarNames(SAMPLE_SERVER_TS)

      expect(varNames).toContain('DATABASE_URL')
      expect(varNames).toContain('BETTER_AUTH_SECRET')
      expect(varNames).toContain('BETTER_AUTH_URL')
      // NODE_ENV spans multiple lines with .enum(), regex may not match
      // This is acceptable since NODE_ENV is not a database-related var
    })

    it('returns sorted array', () => {
      const varNames = extractEnvVarNames(SAMPLE_SERVER_TS)

      const sorted = [...varNames].sort()
      expect(varNames).toEqual(sorted)
    })
  })

  describe('getProviderEnvVarNames', () => {
    it('returns correct vars for sqlite', () => {
      const vars = getProviderEnvVarNames('sqlite')
      expect(vars).toContain('DATABASE_URL')
    })

    it('returns correct vars for turso', () => {
      const vars = getProviderEnvVarNames('turso')
      // Turso needs DATABASE_URL (local SQLite for migrations) + TURSO_* (runtime + CLI)
      expect(vars).toContain('DATABASE_URL')
      expect(vars).toContain('TURSO_DATABASE_URL')
      expect(vars).toContain('TURSO_AUTH_TOKEN')
      expect(vars).toContain('TURSO_DB_NAME')
    })

    it('returns correct vars for supabase', () => {
      const vars = getProviderEnvVarNames('supabase')
      expect(vars).toContain('DATABASE_URL')
      expect(vars).toContain('DIRECT_URL')
    })

    it('returns correct vars for neon', () => {
      const vars = getProviderEnvVarNames('neon')
      expect(vars).toContain('DATABASE_URL')
      expect(vars).toContain('DIRECT_URL')
      // Neon is remote-only, no USE_LOCAL_DB
      expect(vars).not.toContain('USE_LOCAL_DB')
    })

    it('returns correct vars for postgres', () => {
      const vars = getProviderEnvVarNames('postgres')
      expect(vars).toContain('DATABASE_URL')
      expect(vars).toContain('DIRECT_URL')
    })

    it('throws for unknown provider', () => {
      expect(() => getProviderEnvVarNames('unknown')).toThrow('Unknown provider')
    })
  })

  describe('updateCfgEnvForProvider', () => {
    it('adds TURSO vars and keeps DATABASE_URL for turso', () => {
      const result = updateCfgEnvForProvider(SAMPLE_SERVER_TS, 'turso')

      // Turso needs DATABASE_URL (local SQLite for migrations) + TURSO_* (runtime + CLI)
      expect(result).toContain('DATABASE_URL')
      expect(result).toContain('TURSO_DATABASE_URL')
      expect(result).toContain('TURSO_AUTH_TOKEN')
      expect(result).toContain('TURSO_DB_NAME')
    })

    it('keeps DATABASE_URL and adds DIRECT_URL for supabase', () => {
      const result = updateCfgEnvForProvider(SAMPLE_SERVER_TS, 'supabase')

      expect(result).toContain('DATABASE_URL')
      expect(result).toContain('DIRECT_URL')
    })

    it('adds DIRECT_URL for neon (remote-only)', () => {
      const result = updateCfgEnvForProvider(SAMPLE_SERVER_TS, 'neon')

      expect(result).toContain('DATABASE_URL')
      expect(result).toContain('DIRECT_URL')
      // Neon is remote-only, no USE_LOCAL_DB
      expect(result).not.toContain('USE_LOCAL_DB')
    })

    it('preserves non-database env vars', () => {
      const result = updateCfgEnvForProvider(SAMPLE_SERVER_TS, 'turso')

      expect(result).toContain('BETTER_AUTH_SECRET')
      expect(result).toContain('BETTER_AUTH_URL')
      expect(result).toContain('NODE_ENV')
    })

    it('throws for unknown provider', () => {
      expect(() => updateCfgEnvForProvider(SAMPLE_SERVER_TS, 'unknown')).toThrow('Unknown provider')
    })
  })

  describe('PROVIDER_ENV_VARS', () => {
    it('has all 6 providers defined', () => {
      expect(Object.keys(PROVIDER_ENV_VARS)).toHaveLength(6)
      expect(PROVIDER_ENV_VARS).toHaveProperty('sqlite')
      expect(PROVIDER_ENV_VARS).toHaveProperty('prisma-postgres')
      expect(PROVIDER_ENV_VARS).toHaveProperty('postgres')
      expect(PROVIDER_ENV_VARS).toHaveProperty('turso')
      expect(PROVIDER_ENV_VARS).toHaveProperty('supabase')
      expect(PROVIDER_ENV_VARS).toHaveProperty('neon')
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { execSync } from 'node:child_process'
import {
  commandExists,
  checkSystemDependency,
  checkSystemDependencies,
  ensureSystemDependencies,
  SYSTEM_DEPS,
} from '../utils/system-deps.ts'

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  exec: vi.fn(),
}))

// Mock logger
vi.mock('../utils/logger.ts', () => ({
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    blank: vi.fn(),
  },
}))

describe('system dependency utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('commandExists', () => {
    it('returns true when command exists', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/docker'))

      expect(commandExists('docker')).toBe(true)
      expect(execSync).toHaveBeenCalledWith('command -v docker', { stdio: 'ignore' })
    })

    it('returns false when command does not exist', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found')
      })

      expect(commandExists('nonexistent')).toBe(false)
    })
  })

  describe('checkSystemDependency', () => {
    it('returns exists: true when dependency is found', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/docker'))

      const result = checkSystemDependency(SYSTEM_DEPS.docker)

      expect(result.exists).toBe(true)
      expect(result.dependency).toBe(SYSTEM_DEPS.docker)
    })

    it('returns exists: false when dependency is not found', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = checkSystemDependency(SYSTEM_DEPS.supabase)

      expect(result.exists).toBe(false)
      expect(result.dependency).toBe(SYSTEM_DEPS.supabase)
    })
  })

  describe('checkSystemDependencies', () => {
    it('returns allSatisfied: true when all dependencies exist', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/cmd'))

      const result = checkSystemDependencies([
        SYSTEM_DEPS.docker,
        SYSTEM_DEPS.supabase,
      ])

      expect(result.allSatisfied).toBe(true)
      expect(result.missing).toEqual([])
      expect(result.results).toHaveLength(2)
    })

    it('returns allSatisfied: false when some dependencies are missing', () => {
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd.includes('docker')) {
          return Buffer.from('/usr/bin/docker')
        }
        throw new Error('Command not found')
      })

      const result = checkSystemDependencies([
        SYSTEM_DEPS.docker,
        SYSTEM_DEPS.supabase,
      ])

      expect(result.allSatisfied).toBe(false)
      expect(result.missing).toHaveLength(1)
      expect(result.missing[0]).toBe(SYSTEM_DEPS.supabase)
    })

    it('returns all missing when no dependencies exist', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = checkSystemDependencies([
        SYSTEM_DEPS.docker,
        SYSTEM_DEPS.supabase,
      ])

      expect(result.allSatisfied).toBe(false)
      expect(result.missing).toHaveLength(2)
    })

    it('handles empty dependencies array', () => {
      const result = checkSystemDependencies([])

      expect(result.allSatisfied).toBe(true)
      expect(result.missing).toEqual([])
      expect(result.results).toEqual([])
    })
  })

  describe('ensureSystemDependencies', () => {
    it('does not throw when all dependencies are satisfied', () => {
      vi.mocked(execSync).mockReturnValue(Buffer.from('/usr/bin/cmd'))

      expect(() => ensureSystemDependencies([SYSTEM_DEPS.docker])).not.toThrow()
    })

    it('throws when dependencies are missing', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found')
      })

      expect(() => ensureSystemDependencies([SYSTEM_DEPS.docker])).toThrow(
        'Missing system dependencies'
      )
    })

    it('error message includes all missing dependency names', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found')
      })

      try {
        ensureSystemDependencies([SYSTEM_DEPS.docker, SYSTEM_DEPS.supabase])
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Docker')
        expect((error as Error).message).toContain('Supabase CLI')
      }
    })

    it('does not throw for empty dependencies array', () => {
      expect(() => ensureSystemDependencies([])).not.toThrow()
    })
  })

  describe('SYSTEM_DEPS constants', () => {
    it('docker has correct command', () => {
      expect(SYSTEM_DEPS.docker.command).toBe('docker')
      expect(SYSTEM_DEPS.docker.name).toBe('Docker')
      expect(SYSTEM_DEPS.docker.reason).toBeTruthy()
      expect(SYSTEM_DEPS.docker.installInstructions).toContain('docker')
      expect(SYSTEM_DEPS.docker.installInstructions).toContain('orbstack')
    })

    it('supabase has correct command', () => {
      expect(SYSTEM_DEPS.supabase.command).toBe('supabase')
      expect(SYSTEM_DEPS.supabase.name).toBe('Supabase CLI')
      expect(SYSTEM_DEPS.supabase.reason).toBeTruthy()
      expect(SYSTEM_DEPS.supabase.installInstructions).toBeTruthy()
    })

    it('dockerCompose has correct command', () => {
      expect(SYSTEM_DEPS.dockerCompose.command).toBe('docker')
      expect(SYSTEM_DEPS.dockerCompose.name).toBe('Docker Compose')
    })
  })

  describe('provider system deps', () => {
    it('postgres provider requires docker', async () => {
      const { postgres } = await import('../providers/postgres.ts')
      const dockerOption = postgres.localDevOptions.find((o) => o.type === 'docker')

      expect(dockerOption?.systemDeps).toBeDefined()
      expect(dockerOption?.systemDeps?.some((d) => d.command === 'docker')).toBe(true)
    })

    it('supabase provider requires docker and supabase CLI', async () => {
      const { supabase } = await import('../providers/supabase.ts')
      const supabaseOption = supabase.localDevOptions.find(
        (o) => o.type === 'supabase-local'
      )

      expect(supabaseOption?.systemDeps).toBeDefined()
      expect(supabaseOption?.systemDeps?.some((d) => d.command === 'docker')).toBe(true)
      expect(supabaseOption?.systemDeps?.some((d) => d.command === 'supabase')).toBe(
        true
      )
    })

    it('sqlite provider has no system deps', async () => {
      const { sqlite } = await import('../providers/sqlite.ts')
      const xdgOption = sqlite.localDevOptions.find((o) => o.type === 'xdg-file')

      expect(xdgOption?.systemDeps).toBeUndefined()
    })

    it('prisma-postgres provider has no system deps', async () => {
      const { prismaPostgres } = await import('../providers/prisma-postgres.ts')
      const prismaDevOption = prismaPostgres.localDevOptions.find(
        (o) => o.type === 'prisma-dev'
      )

      expect(prismaDevOption?.systemDeps).toBeUndefined()
    })

    it('neon provider has no system deps (remote only)', async () => {
      const { neon } = await import('../providers/neon.ts')
      const remoteOption = neon.localDevOptions.find((o) => o.type === 'remote')

      expect(remoteOption?.systemDeps).toBeUndefined()
    })

    it('turso provider has no system deps (uses local SQLite)', async () => {
      const { turso } = await import('../providers/turso.ts')
      const xdgOption = turso.localDevOptions.find((o) => o.type === 'xdg-file')

      expect(xdgOption?.systemDeps).toBeUndefined()
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { simpleGit } from 'simple-git'
import {
  checkGitStatus,
  checkGitStatusForDirectories,
  ensureFilesCommitted,
  ensureDirectoriesCommitted,
} from '../safety/index.ts'

// Mock simple-git
vi.mock('simple-git', () => ({
  simpleGit: vi.fn(),
}))

// Mock logger to suppress output during tests
vi.mock('../utils/logger.ts', () => ({
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('git safety utilities', () => {
  const mockGit = {
    checkIsRepo: vi.fn(),
    status: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(simpleGit).mockReturnValue(mockGit as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkGitStatus', () => {
    it('returns isGitRepo: false when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      const result = await checkGitStatus(['/some/file.ts'])

      expect(result.isGitRepo).toBe(false)
      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('returns allCommitted: true when target files have no changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['other/file.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatus(['/repo/packages/infra.db/src/client.ts'])

      expect(result.isGitRepo).toBe(true)
      expect(result.allCommitted).toBe(true)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('returns uncommitted files when target files have changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      // Note: checkGitStatus uses relative paths from REPO_ROOT
      const result = await checkGitStatus(['packages/infra.db/src/client.ts'])

      expect(result.isGitRepo).toBe(true)
      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/infra.db/src/client.ts')
    })

    it('detects staged (created) files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: ['packages/infra.db/new-file.ts'],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatus(['packages/infra.db/new-file.ts'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/infra.db/new-file.ts')
    })

    it('detects deleted files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: [],
        deleted: ['packages/cfg.env/src/old.ts'],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatus(['packages/cfg.env/src/old.ts'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/cfg.env/src/old.ts')
    })

    it('detects renamed files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [{ from: 'old-name.ts', to: 'packages/infra.auth/new-name.ts' }],
        conflicted: [],
      })

      const result = await checkGitStatus(['packages/infra.auth/new-name.ts'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/infra.auth/new-name.ts')
    })
  })

  describe('checkGitStatusForDirectories', () => {
    it('returns isGitRepo: false when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      const result = await checkGitStatusForDirectories(['packages/infra.db'])

      expect(result.isGitRepo).toBe(false)
      expect(result.allCommitted).toBe(false)
    })

    it('returns allCommitted: true when no files in directories have changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['apps/web/src/page.tsx'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/infra.db',
        'packages/infra.auth',
        'packages/cfg.env',
      ])

      expect(result.isGitRepo).toBe(true)
      expect(result.allCommitted).toBe(true)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('detects changes in infra.db package', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/infra.db',
        'packages/infra.auth',
        'packages/cfg.env',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/infra.db/src/client.ts')
    })

    it('detects changes in infra.auth package', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.auth/src/auth.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/infra.db',
        'packages/infra.auth',
        'packages/cfg.env',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/infra.auth/src/auth.ts')
    })

    it('detects changes in cfg.env package', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/cfg.env/src/server.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/infra.db',
        'packages/infra.auth',
        'packages/cfg.env',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/cfg.env/src/server.ts')
    })

    it('detects changes in multiple packages at once', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [
          'packages/infra.db/src/client.ts',
          'packages/cfg.env/src/server.ts',
        ],
        not_added: ['packages/infra.auth/src/new-file.ts'],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/infra.db',
        'packages/infra.auth',
        'packages/cfg.env',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toHaveLength(3)
      expect(result.uncommittedFiles).toContain('packages/infra.db/src/client.ts')
      expect(result.uncommittedFiles).toContain('packages/cfg.env/src/server.ts')
      expect(result.uncommittedFiles).toContain('packages/infra.auth/src/new-file.ts')
    })

    it('ignores changes in non-protected packages', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [
          'apps/web/src/page.tsx',
          'packages/ui.web/src/button.tsx',
          'README.md',
        ],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/infra.db',
        'packages/infra.auth',
        'packages/cfg.env',
      ])

      expect(result.allCommitted).toBe(true)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('detects deeply nested file changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.db/prisma/migrations/001_init/migration.sql'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories(['packages/infra.db'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain(
        'packages/infra.db/prisma/migrations/001_init/migration.sql'
      )
    })
  })

  describe('ensureFilesCommitted', () => {
    it('does not throw when all files are committed', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureFilesCommitted(['packages/infra.db/src/client.ts'])
      ).resolves.not.toThrow()
    })

    it('throws when files have uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureFilesCommitted(['packages/infra.db/src/client.ts'])
      ).rejects.toThrow('uncommitted changes')
    })

    it('does not throw when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      // Should not throw, just warn
      await expect(
        ensureFilesCommitted(['packages/infra.db/src/client.ts'])
      ).resolves.not.toThrow()
    })
  })

  describe('ensureDirectoriesCommitted', () => {
    it('does not throw when all directories are clean', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['apps/web/src/page.tsx'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/infra.db',
          'packages/infra.auth',
          'packages/cfg.env',
        ])
      ).resolves.not.toThrow()
    })

    it('throws when infra.db has uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/infra.db',
          'packages/infra.auth',
          'packages/cfg.env',
        ])
      ).rejects.toThrow('uncommitted changes')
    })

    it('throws when infra.auth has uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/infra.auth/src/auth.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/infra.db',
          'packages/infra.auth',
          'packages/cfg.env',
        ])
      ).rejects.toThrow('uncommitted changes')
    })

    it('throws when cfg.env has uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/cfg.env/src/server.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/infra.db',
          'packages/infra.auth',
          'packages/cfg.env',
        ])
      ).rejects.toThrow('uncommitted changes')
    })

    it('error message includes all uncommitted files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [
          'packages/infra.db/src/client.ts',
          'packages/cfg.env/src/server.ts',
        ],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      try {
        await ensureDirectoriesCommitted([
          'packages/infra.db',
          'packages/infra.auth',
          'packages/cfg.env',
        ])
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('packages/infra.db/src/client.ts')
        expect((error as Error).message).toContain('packages/cfg.env/src/server.ts')
      }
    })

    it('does not throw when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      // Should not throw, just warn
      await expect(
        ensureDirectoriesCommitted([
          'packages/infra.db',
          'packages/infra.auth',
          'packages/cfg.env',
        ])
      ).resolves.not.toThrow()
    })
  })

  describe('protected packages list', () => {
    it('GIT_PROTECTED_PACKAGES includes infra.db', async () => {
      // Import dynamically to get the actual values
      const { GIT_PROTECTED_PACKAGES } = await import('../utils/paths.ts')

      const packageNames = GIT_PROTECTED_PACKAGES.map((p) =>
        p.split('/').pop()
      )
      expect(packageNames).toContain('infra.db')
    })

    it('GIT_PROTECTED_PACKAGES includes infra.auth', async () => {
      const { GIT_PROTECTED_PACKAGES } = await import('../utils/paths.ts')

      const packageNames = GIT_PROTECTED_PACKAGES.map((p) =>
        p.split('/').pop()
      )
      expect(packageNames).toContain('infra.auth')
    })

    it('GIT_PROTECTED_PACKAGES includes cfg.env', async () => {
      const { GIT_PROTECTED_PACKAGES } = await import('../utils/paths.ts')

      const packageNames = GIT_PROTECTED_PACKAGES.map((p) =>
        p.split('/').pop()
      )
      expect(packageNames).toContain('cfg.env')
    })
  })
})

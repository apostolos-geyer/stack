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

      const result = await checkGitStatus(['/repo/packages/db/src/client.ts'])

      expect(result.isGitRepo).toBe(true)
      expect(result.allCommitted).toBe(true)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('returns uncommitted files when target files have changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      // Note: checkGitStatus uses relative paths from REPO_ROOT
      const result = await checkGitStatus(['packages/db/src/client.ts'])

      expect(result.isGitRepo).toBe(true)
      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/db/src/client.ts')
    })

    it('detects staged (created) files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: ['packages/db/new-file.ts'],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatus(['packages/db/new-file.ts'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/db/new-file.ts')
    })

    it('detects deleted files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: [],
        deleted: ['packages/platform/src/old.ts'],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatus(['packages/platform/src/old.ts'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/platform/src/old.ts')
    })

    it('detects renamed files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [{ from: 'old-name.ts', to: 'packages/features/new-name.ts' }],
        conflicted: [],
      })

      const result = await checkGitStatus(['packages/features/new-name.ts'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/features/new-name.ts')
    })
  })

  describe('checkGitStatusForDirectories', () => {
    it('returns isGitRepo: false when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      const result = await checkGitStatusForDirectories(['packages/db'])

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
        'packages/db',
        'packages/features',
        'packages/platform',
      ])

      expect(result.isGitRepo).toBe(true)
      expect(result.allCommitted).toBe(true)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('detects changes in db package', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/db',
        'packages/features',
        'packages/platform',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/db/src/client.ts')
    })

    it('detects changes in features package', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/features/src/auth/auth.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/db',
        'packages/features',
        'packages/platform',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/features/src/auth/auth.ts')
    })

    it('detects changes in platform package', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/platform/src/server.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/db',
        'packages/features',
        'packages/platform',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain('packages/platform/src/server.ts')
    })

    it('detects changes in multiple packages at once', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [
          'packages/db/src/client.ts',
          'packages/platform/src/server.ts',
        ],
        not_added: ['packages/features/src/new-file.ts'],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories([
        'packages/db',
        'packages/features',
        'packages/platform',
      ])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toHaveLength(3)
      expect(result.uncommittedFiles).toContain('packages/db/src/client.ts')
      expect(result.uncommittedFiles).toContain('packages/platform/src/server.ts')
      expect(result.uncommittedFiles).toContain('packages/features/src/new-file.ts')
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
        'packages/db',
        'packages/features',
        'packages/platform',
      ])

      expect(result.allCommitted).toBe(true)
      expect(result.uncommittedFiles).toEqual([])
    })

    it('detects deeply nested file changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/db/prisma/migrations/001_init/migration.sql'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      const result = await checkGitStatusForDirectories(['packages/db'])

      expect(result.allCommitted).toBe(false)
      expect(result.uncommittedFiles).toContain(
        'packages/db/prisma/migrations/001_init/migration.sql'
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
        ensureFilesCommitted(['packages/db/src/client.ts'])
      ).resolves.not.toThrow()
    })

    it('throws when files have uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureFilesCommitted(['packages/db/src/client.ts'])
      ).rejects.toThrow('uncommitted changes')
    })

    it('does not throw when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      // Should not throw, just warn
      await expect(
        ensureFilesCommitted(['packages/db/src/client.ts'])
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
          'packages/db',
          'packages/infra.auth',
          'packages/platform',
        ])
      ).resolves.not.toThrow()
    })

    it('throws when db has uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/db/src/client.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/db',
          'packages/infra.auth',
          'packages/platform',
        ])
      ).rejects.toThrow('uncommitted changes')
    })

    it('throws when features has uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/features/src/auth/auth.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/db',
          'packages/infra.auth',
          'packages/platform',
        ])
      ).rejects.toThrow('uncommitted changes')
    })

    it('throws when platform has uncommitted changes', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: ['packages/platform/src/server.ts'],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      await expect(
        ensureDirectoriesCommitted([
          'packages/db',
          'packages/infra.auth',
          'packages/platform',
        ])
      ).rejects.toThrow('uncommitted changes')
    })

    it('error message includes all uncommitted files', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true)
      mockGit.status.mockResolvedValue({
        modified: [
          'packages/db/src/client.ts',
          'packages/platform/src/server.ts',
        ],
        not_added: [],
        created: [],
        deleted: [],
        renamed: [],
        conflicted: [],
      })

      try {
        await ensureDirectoriesCommitted([
          'packages/db',
          'packages/features',
          'packages/platform',
        ])
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('packages/db/src/client.ts')
        expect((error as Error).message).toContain('packages/platform/src/server.ts')
      }
    })

    it('does not throw when not in a git repository', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false)

      // Should not throw, just warn
      await expect(
        ensureDirectoriesCommitted([
          'packages/db',
          'packages/infra.auth',
          'packages/platform',
        ])
      ).resolves.not.toThrow()
    })
  })

  describe('protected packages list', () => {
    it('GIT_PROTECTED_PACKAGES includes db', async () => {
      // Import dynamically to get the actual values
      const { GIT_PROTECTED_PACKAGES } = await import('../utils/paths.ts')

      const packageNames = GIT_PROTECTED_PACKAGES.map((p) =>
        p.split('/').pop()
      )
      expect(packageNames).toContain('db')
    })

    it('GIT_PROTECTED_PACKAGES includes features', async () => {
      const { GIT_PROTECTED_PACKAGES } = await import('../utils/paths.ts')

      const packageNames = GIT_PROTECTED_PACKAGES.map((p) =>
        p.split('/').pop()
      )
      expect(packageNames).toContain('features')
    })

    it('GIT_PROTECTED_PACKAGES includes platform', async () => {
      const { GIT_PROTECTED_PACKAGES } = await import('../utils/paths.ts')

      const packageNames = GIT_PROTECTED_PACKAGES.map((p) =>
        p.split('/').pop()
      )
      expect(packageNames).toContain('platform')
    })
  })
})

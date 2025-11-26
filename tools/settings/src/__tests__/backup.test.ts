import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFile, unlink, mkdir, rmdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createBackup, restoreBackup, createBackups, restoreBackups } from '../safety/backup.ts'

describe('backup utilities', () => {
  let testDir: string
  let testFile: string

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `settings-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
    testFile = path.join(testDir, 'test-file.txt')
  })

  afterEach(async () => {
    // Clean up test files
    try {
      if (existsSync(testFile)) await unlink(testFile)
      if (existsSync(testDir)) await rmdir(testDir, { recursive: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('createBackup', () => {
    it('creates backup with correct content', async () => {
      const originalContent = 'original content'
      await writeFile(testFile, originalContent)

      const backup = await createBackup(testFile)

      expect(backup.filePath).toBe(testFile)
      expect(backup.originalContent).toBe(originalContent)
      expect(backup.timestamp).toBeGreaterThan(0)
    })

    it('throws error for non-existent file', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.txt')

      await expect(createBackup(nonExistentFile)).rejects.toThrow()
    })
  })

  describe('restoreBackup', () => {
    it('restores file to original content', async () => {
      const originalContent = 'original content'
      await writeFile(testFile, originalContent)

      const backup = await createBackup(testFile)

      // Modify the file
      await writeFile(testFile, 'modified content')

      // Restore from backup
      await restoreBackup(backup)

      // Verify content is restored
      const restoredContent = await readFile(testFile, 'utf-8')
      expect(restoredContent).toBe(originalContent)
    })
  })

  describe('createBackups', () => {
    it('creates backups for multiple files', async () => {
      const file1 = path.join(testDir, 'file1.txt')
      const file2 = path.join(testDir, 'file2.txt')

      await writeFile(file1, 'content 1')
      await writeFile(file2, 'content 2')

      const backups = await createBackups([file1, file2])

      expect(backups).toHaveLength(2)
      expect(backups[0].originalContent).toBe('content 1')
      expect(backups[1].originalContent).toBe('content 2')
    })
  })

  describe('restoreBackups', () => {
    it('restores multiple files from backups', async () => {
      const file1 = path.join(testDir, 'file1.txt')
      const file2 = path.join(testDir, 'file2.txt')

      await writeFile(file1, 'original 1')
      await writeFile(file2, 'original 2')

      const backups = await createBackups([file1, file2])

      // Modify both files
      await writeFile(file1, 'modified 1')
      await writeFile(file2, 'modified 2')

      // Restore from backups
      await restoreBackups(backups)

      // Verify both files are restored
      expect(await readFile(file1, 'utf-8')).toBe('original 1')
      expect(await readFile(file2, 'utf-8')).toBe('original 2')
    })
  })
})

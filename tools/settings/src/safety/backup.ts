import { readFile, writeFile } from 'node:fs/promises'
import { log } from '../utils/logger.ts'

export interface Backup {
  filePath: string
  originalContent: string
  timestamp: number
}

/**
 * Create a backup of a single file
 * @param filePath - Absolute path to the file to backup
 * @returns Backup object containing file path, content, and timestamp
 */
export async function createBackup(filePath: string): Promise<Backup> {
  try {
    const originalContent = await readFile(filePath, 'utf-8')
    const backup: Backup = {
      filePath,
      originalContent,
      timestamp: Date.now(),
    }
    log.info(`Created backup for ${filePath}`)
    return backup
  } catch (error) {
    const errorMsg = `Failed to create backup for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    log.error(errorMsg)
    throw new Error(errorMsg)
  }
}

/**
 * Restore a file from a backup
 * @param backup - Backup object to restore from
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  try {
    await writeFile(backup.filePath, backup.originalContent, 'utf-8')
    log.success(`Restored ${backup.filePath}`)
  } catch (error) {
    const errorMsg = `Failed to restore backup for ${backup.filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    log.error(errorMsg)
    throw new Error(errorMsg)
  }
}

/**
 * Create backups for multiple files
 * @param filePaths - Array of absolute file paths to backup
 * @returns Array of Backup objects
 */
export async function createBackups(filePaths: string[]): Promise<Backup[]> {
  log.info(`Creating backups for ${filePaths.length} files...`)
  const backups: Backup[] = []

  for (const filePath of filePaths) {
    try {
      const backup = await createBackup(filePath)
      backups.push(backup)
    } catch (error) {
      // If any backup fails, restore all previously created backups
      log.error(
        `Backup failed for ${filePath}, restoring previous backups...`
      )
      await restoreBackups(backups)
      throw error
    }
  }

  log.success(`Successfully created ${backups.length} backups`)
  return backups
}

/**
 * Restore multiple files from backups
 * @param backups - Array of Backup objects to restore
 */
export async function restoreBackups(backups: Backup[]): Promise<void> {
  log.info(`Restoring ${backups.length} files from backup...`)
  const errors: Error[] = []

  for (const backup of backups) {
    try {
      await restoreBackup(backup)
    } catch (error) {
      // Collect errors but continue restoring other files
      errors.push(
        error instanceof Error
          ? error
          : new Error(`Unknown error restoring ${backup.filePath}`)
      )
    }
  }

  if (errors.length > 0) {
    const errorMsg = `Failed to restore ${errors.length} files:\n${errors.map((e) => `  - ${e.message}`).join('\n')}`
    log.error(errorMsg)
    throw new Error(errorMsg)
  }

  log.success(`Successfully restored ${backups.length} files`)
}

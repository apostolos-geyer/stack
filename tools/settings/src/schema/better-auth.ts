import { readFile, writeFile } from 'node:fs/promises'
import { confirm } from '@inquirer/prompts'
import { createBackup, restoreBackup, type Backup } from '../safety/backup.ts'
import { generateFileDiff } from '../diff/generator.ts'
import { displayDiff } from '../diff/display.ts'
import { exec } from '../utils/exec.ts'
import { log } from '../utils/logger.ts'

/**
 * Result of running the Better Auth CLI generate command
 * @description Contains success status and details about changes made to schema.prisma
 */
export interface BetterAuthResult {
  /**
   * Whether the Better Auth CLI ran successfully
   */
  success: boolean
  /**
   * Description of changes made to the schema
   */
  changes: string
  /**
   * Whether user approved the changes
   */
  approved: boolean
}

/**
 * Checks if Better Auth models already exist in schema
 * @description Looks for User, Session, Account, and Verification models in the schema content
 * @param schemaContent - Content of schema.prisma file
 * @returns true if all four Better Auth models exist
 * @example
 * ```typescript
 * const schema = await readFile('schema.prisma', 'utf-8')
 * if (hasBetterAuthModels(schema)) {
 *   console.log('Better Auth models already present')
 * }
 * ```
 */
export function hasBetterAuthModels(schemaContent: string): boolean {
  const requiredModels = ['model User', 'model Session', 'model Account', 'model Verification']
  return requiredModels.every(model => schemaContent.includes(model))
}

/**
 * Runs the Better Auth CLI to generate auth models in schema.prisma
 * @description Executes `npx @better-auth/cli@latest generate` to add auth models to the schema.
 * Shows a diff of the changes and requires user approval before applying them.
 * Creates a backup before running and can restore on failure or rejection.
 * @param schemaPath - Absolute path to schema.prisma file
 * @returns Object with success status, changes description, and approval status
 * @throws Error if user rejects changes, CLI fails, or file operations fail
 * @example
 * ```typescript
 * try {
 *   const result = await runBetterAuthGenerate('/path/to/schema.prisma')
 *   console.log(`Success: ${result.success}`)
 *   console.log(`Changes: ${result.changes}`)
 * } catch (error) {
 *   console.error('Better Auth generation failed:', error)
 * }
 * ```
 */
export async function runBetterAuthGenerate(schemaPath: string): Promise<BetterAuthResult> {
  log.header('Running Better Auth CLI')

  let backup: Backup | null = null

  try {
    // Read current schema content
    const originalContent = await readFile(schemaPath, 'utf-8')

    // Check if models already exist
    if (hasBetterAuthModels(originalContent)) {
      log.info('Better Auth models already exist in schema.prisma')
      return {
        success: true,
        changes: 'No changes - models already present',
        approved: true,
      }
    }

    // Create backup before running CLI
    log.info('Creating backup of schema.prisma...')
    backup = await createBackup(schemaPath)

    // Run Better Auth CLI
    log.info('Running Better Auth CLI to generate auth models...')
    try {
      await exec('npx @better-auth/cli@latest generate')
    } catch (error) {
      throw new Error(
        `Better Auth CLI failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    // Read the modified schema
    const modifiedContent = await readFile(schemaPath, 'utf-8')

    // Generate diff
    const diff = await generateFileDiff(schemaPath, modifiedContent)

    // If no changes were made (shouldn't happen, but check anyway)
    if (!diff || diff.trim() === '') {
      log.warn('Better Auth CLI ran but made no changes to schema.prisma')
      return {
        success: true,
        changes: 'No changes made',
        approved: true,
      }
    }

    // Display the diff
    log.header('Better Auth Schema Changes')
    displayDiff(diff)
    log.blank()

    // Ask for user approval
    const approved = await confirm({
      message: 'Apply these Better Auth schema changes?',
      default: true,
    })

    if (!approved) {
      // Restore backup if user rejects
      log.warn('Changes rejected by user, restoring backup...')
      await restoreBackup(backup)
      throw new Error('Better Auth schema changes rejected by user')
    }

    log.success('Better Auth models added to schema.prisma')

    return {
      success: true,
      changes: 'Added User, Session, Account, and Verification models',
      approved: true,
    }
  } catch (error) {
    // Restore backup on any error (if backup was created)
    if (backup) {
      log.error('Error occurred, restoring backup...')
      try {
        await restoreBackup(backup)
      } catch (restoreError) {
        log.error(
          `Failed to restore backup: ${restoreError instanceof Error ? restoreError.message : 'Unknown error'}`
        )
      }
    }

    throw error
  }
}

import { readFile, writeFile } from 'node:fs/promises'
import { confirm } from '@inquirer/prompts'
import { createBackup, restoreBackup, type Backup } from '../safety/backup.ts'
import { generateFileDiff } from '../diff/generator.ts'
import { displayDiff } from '../diff/display.ts'
import { log } from '../utils/logger.ts'

/**
 * Supported database providers
 */
export type DatabaseProvider = 'sqlite' | 'postgresql'

/**
 * Result of patching schema.prisma
 * @description Contains success status, diff of changes, and approval status
 */
export interface PatchResult {
  /**
   * Whether the patch was successful
   */
  success: boolean
  /**
   * Unified diff string of changes made
   */
  diff: string
  /**
   * Whether user approved the changes
   */
  approved: boolean
}

/**
 * Updates the datasource provider in schema.prisma
 * @description Replaces the provider value in the datasource db block
 * @param schemaContent - Current schema.prisma content
 * @param provider - New provider ("sqlite" | "postgresql")
 * @returns Modified schema content with updated provider
 * @example
 * ```typescript
 * const schema = await readFile('schema.prisma', 'utf-8')
 * const updated = updateDatasourceProvider(schema, 'postgresql')
 * ```
 */
export function updateDatasourceProvider(
  schemaContent: string,
  provider: DatabaseProvider
): string {
  // Match datasource block and replace provider
  const datasourceRegex = /(datasource\s+db\s*\{[^}]*provider\s*=\s*)"[^"]*"/

  if (!datasourceRegex.test(schemaContent)) {
    throw new Error('Could not find datasource provider in schema.prisma')
  }

  return schemaContent.replace(datasourceRegex, `$1"${provider}"`)
}

/**
 * Ensures the generator block has correct Prisma 7 settings
 * @description Verifies that the generator uses "prisma-client" provider
 * (not "prisma-client-js") for Prisma 7 compatibility
 * @param schemaContent - Current schema.prisma content
 * @returns Modified schema content with correct generator settings
 * @example
 * ```typescript
 * const schema = await readFile('schema.prisma', 'utf-8')
 * const updated = ensurePrisma7Generator(schema)
 * await writeFile('schema.prisma', updated)
 * ```
 */
export function ensurePrisma7Generator(schemaContent: string): string {
  // Check if generator is using old "prisma-client-js" (Prisma 6 and below)
  const oldGeneratorRegex = /(generator\s+client\s*\{[^}]*provider\s*=\s*)"prisma-client-js"/

  if (oldGeneratorRegex.test(schemaContent)) {
    log.info('Updating generator to Prisma 7 format...')
    return schemaContent.replace(oldGeneratorRegex, '$1"prisma-client"')
  }

  // Already using correct format
  return schemaContent
}

/**
 * Removes deprecated url field from datasource block (Prisma 7)
 * @description In Prisma 7, the URL is configured in prisma.config.ts, not schema.prisma
 * This function removes any url field from the datasource block
 * @param schemaContent - Current schema.prisma content
 * @returns Modified schema content with url field removed
 */
export function removeDatasourceUrl(schemaContent: string): string {
  // Remove url line from datasource block if present
  // Match: url = env("...") or url = "..."
  return schemaContent.replace(
    /(\n\s*url\s*=\s*(?:env\("[^"]*"\)|"[^"]*"))/g,
    ''
  )
}

/**
 * Options for patchSchemaForProvider
 */
export interface PatchSchemaOptions {
  /** Skip user confirmation (used when called from db-switch which has its own confirmation) */
  skipConfirm?: boolean
  /** Skip creating backup (used when caller manages backups) */
  skipBackup?: boolean
}

/**
 * Applies all schema patches needed for a provider switch
 * @description Performs the following operations:
 * 1. Creates backup of schema.prisma (unless skipBackup)
 * 2. Updates datasource provider
 * 3. Ensures Prisma 7 generator format
 * 4. Removes deprecated url field (Prisma 7 uses prisma.config.ts)
 * 5. Shows diff and requests user approval (unless skipConfirm)
 * 6. Applies changes or restores backup on rejection
 * @param schemaPath - Absolute path to schema.prisma file
 * @param provider - Target database provider
 * @param options - Optional settings to skip confirm/backup
 * @returns PatchResult with success status and diff
 * @throws Error if user rejects changes or file operations fail
 * @example
 * ```typescript
 * // With confirmation
 * const result = await patchSchemaForProvider('/path/to/schema.prisma', 'postgresql')
 *
 * // Without confirmation (called from parent command that already confirmed)
 * const result = await patchSchemaForProvider('/path/to/schema.prisma', 'postgresql', {
 *   skipConfirm: true,
 *   skipBackup: true
 * })
 * ```
 */
export async function patchSchemaForProvider(
  schemaPath: string,
  provider: DatabaseProvider,
  options: PatchSchemaOptions = {}
): Promise<PatchResult> {
  const { skipConfirm = false, skipBackup = false } = options
  log.info(`Patching schema for ${provider}...`)

  let backup: Backup | null = null

  try {
    // Read current schema
    const originalContent = await readFile(schemaPath, 'utf-8')

    // Create backup (unless caller is managing backups)
    if (!skipBackup) {
      log.info('Creating backup of schema.prisma...')
      backup = await createBackup(schemaPath)
    }

    // Apply patches
    let modifiedContent = originalContent

    // 1. Update provider
    modifiedContent = updateDatasourceProvider(modifiedContent, provider)

    // 2. Ensure Prisma 7 generator
    modifiedContent = ensurePrisma7Generator(modifiedContent)

    // 3. Remove deprecated url field (Prisma 7 uses prisma.config.ts for URL)
    modifiedContent = removeDatasourceUrl(modifiedContent)

    // Generate diff
    const diff = await generateFileDiff(schemaPath, modifiedContent)

    // If no changes needed
    if (!diff || diff.trim() === '') {
      log.info('Schema already configured correctly for this provider')
      return {
        success: true,
        diff: '',
        approved: true,
      }
    }

    // Display diff and ask for approval (unless skipped)
    if (!skipConfirm) {
      log.header('Schema Patch Changes')
      displayDiff(diff)
      log.blank()

      const approved = await confirm({
        message: `Apply these schema patches for ${provider}?`,
        default: true,
      })

      if (!approved) {
        if (backup) {
          log.warn('Changes rejected by user, restoring backup...')
          await restoreBackup(backup)
        }
        throw new Error('Schema patch rejected by user')
      }
    }

    // Write modified content
    await writeFile(schemaPath, modifiedContent, 'utf-8')
    log.success(`Schema patched successfully for ${provider}`)

    return {
      success: true,
      diff,
      approved: true,
    }
  } catch (error) {
    // Restore backup on error (if backup was created)
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

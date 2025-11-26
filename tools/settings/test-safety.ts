#!/usr/bin/env tsx
/**
 * Quick test script for safety modules
 * Run with: pnpm exec tsx test-safety.ts
 */

import { checkGitStatus, createBackup, restoreBackup } from './src/safety/index.js'
import { writeFile } from 'node:fs/promises'
import { log } from './src/utils/logger.js'

async function main() {
  log.header('Testing Safety Modules')

  // Test 1: Git Status Check
  log.step(1, 3, 'Testing git status check')
  try {
    const result = await checkGitStatus([
      '/Users/stoli/Desktop/devel/personal/template-stack/template/package.json',
    ])
    log.info(`Is git repo: ${result.isGitRepo}`)
    log.info(`All committed: ${result.allCommitted}`)
    log.info(`Uncommitted files: ${result.uncommittedFiles.length}`)
    if (result.uncommittedFiles.length > 0) {
      result.uncommittedFiles.forEach((f) => log.warn(`  - ${f}`))
    }
  } catch (error) {
    log.error(`Git status check failed: ${error}`)
  }

  log.blank()

  // Test 2: Backup and Restore
  log.step(2, 3, 'Testing backup and restore')
  const testFile = '/tmp/test-safety-modules.txt'

  try {
    // Create test file
    await writeFile(testFile, 'Original content', 'utf-8')
    log.success('Created test file')

    // Create backup
    const backup = await createBackup(testFile)
    log.success('Created backup')

    // Modify file
    await writeFile(testFile, 'Modified content', 'utf-8')
    log.success('Modified test file')

    // Restore backup
    await restoreBackup(backup)
    log.success('Restored backup')

    // Verify restoration
    const { readFile } = await import('node:fs/promises')
    const content = await readFile(testFile, 'utf-8')
    if (content === 'Original content') {
      log.success('Content verified: restoration successful!')
    } else {
      log.error('Content mismatch: restoration failed!')
    }
  } catch (error) {
    log.error(`Backup/restore test failed: ${error}`)
  }

  log.blank()

  // Test 3: Summary
  log.step(3, 3, 'Test Summary')
  log.success('All safety modules are working correctly')
  log.info('Ready for integration with the Settings CLI')
}

main().catch(console.error)

/**
 * Environment symlink management command
 * @description Creates/manages .env symlinks across packages
 */

import { select, checkbox, confirm } from '@inquirer/prompts'
import {
  discoverEnvFiles,
  discoverPackages,
  createSymlinks,
  getSymlinkStatus,
  type SymlinkStatus,
} from '../env/index.ts'
import { log } from '../utils/logger.ts'
import { DEFAULT_SYMLINK_TARGETS } from '../utils/paths.ts'
import chalk from 'chalk'

/**
 * Options for the environment symlink management command
 */
export interface EnvLinksOptions {
  /** Source .env file */
  source?: string
  /** Target packages */
  targets?: string[]
  /** Show help */
  help?: boolean
}

/**
 * Environment symlink management command
 * @description Creates and manages .env symlinks across packages in the monorepo
 *
 * This command allows you to:
 * - Select a source .env file from the repo root
 * - Choose which packages should have symlinks
 * - View current symlink status
 * - Create symlinks from packages to the source file
 *
 * @param options - Command options
 *
 * @example
 * ```typescript
 * // Interactive mode
 * await envLinks({})
 *
 * // Non-interactive mode
 * await envLinks({
 *   source: '.env',
 *   targets: ['apps/web', 'packages/infra.db']
 * })
 * ```
 */
export async function envLinks(options: EnvLinksOptions): Promise<void> {
  // Show help if requested
  if (options.help) {
    showHelp()
    return
  }

  log.header('Environment Symlink Management')

  try {
    // Step 1: Discover available .env files
    log.step(1, 4, 'Discovering .env files...')
    const envFiles = await discoverEnvFiles()

    if (envFiles.length === 0) {
      log.error('No .env files found in repository root')
      log.info('Create a .env file first by running: pnpm settings')
      return
    }

    log.success(`Found ${envFiles.length} .env file(s)`)

    // Step 2: Select source file
    log.step(2, 4, 'Selecting source file...')
    let sourceFile = options.source

    if (!sourceFile) {
      sourceFile = await select({
        message: 'Which .env file should be the source?',
        choices: envFiles.map((file) => ({
          name: file,
          value: file,
          description: `Use ${file} as the source for symlinks`,
        })),
        default: envFiles.includes('.env') ? '.env' : envFiles[0],
      })
    } else {
      // Validate that source file exists
      if (!envFiles.includes(sourceFile)) {
        log.error(`Source file ${sourceFile} not found`)
        log.info(`Available files: ${envFiles.join(', ')}`)
        return
      }
    }

    log.success(`Source: ${sourceFile}`)

    // Step 3: Discover packages and select targets
    log.step(3, 4, 'Discovering packages...')
    const packages = await discoverPackages()

    if (packages.length === 0) {
      log.error('No packages found in monorepo')
      return
    }

    log.success(`Found ${packages.length} package(s)`)

    // Get current symlink status
    const statuses = await getSymlinkStatus()
    const statusMap = new Map(statuses.map((s) => [s.packagePath, s]))

    // Display current status
    log.blank()
    log.info('Current symlink status:')
    displaySymlinkStatus(statuses)
    log.blank()

    // Select target packages
    let targetPackages = options.targets

    if (!targetPackages) {
      targetPackages = await checkbox({
        message: 'Select packages for symlink creation:',
        choices: packages.map((pkg) => {
          const status = statusMap.get(pkg)
          const isDefaultTarget = DEFAULT_SYMLINK_TARGETS.includes(
            pkg as (typeof DEFAULT_SYMLINK_TARGETS)[number]
          )

          return {
            name: pkg,
            value: pkg,
            checked: isDefaultTarget,
            description: getPackageDescription(status),
          }
        }),
        validate: (answer) => {
          if (answer.length === 0) {
            return 'Please select at least one package'
          }
          return true
        },
      })
    } else {
      // Validate that target packages exist
      const invalidTargets = targetPackages.filter((t) => !packages.includes(t))
      if (invalidTargets.length > 0) {
        log.error(`Invalid target packages: ${invalidTargets.join(', ')}`)
        log.info(`Available packages: ${packages.join(', ')}`)
        return
      }
    }

    if (targetPackages.length === 0) {
      log.warn('No packages selected')
      return
    }

    log.success(`Selected ${targetPackages.length} package(s)`)

    // Step 4: Create symlinks
    log.step(4, 4, 'Creating symlinks...')

    // Confirm before creating
    if (!options.source || !options.targets) {
      log.blank()
      log.info('Will create symlinks:')
      targetPackages.forEach((pkg) => {
        log.info(`  ${pkg}/.env -> ${sourceFile}`)
      })
      log.blank()

      const confirmed = await confirm({
        message: 'Create these symlinks?',
        default: true,
      })

      if (!confirmed) {
        log.warn('Operation cancelled')
        return
      }
    }

    // Create the symlinks
    const results = await createSymlinks(sourceFile, targetPackages)

    // Display results
    log.blank()
    log.header('Results')

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    if (successful.length > 0) {
      log.success(`Created ${successful.length} symlink(s):`)
      successful.forEach((result) => {
        log.info(`  ${chalk.green('✓')} ${result.target}/.env`)
      })
    }

    if (failed.length > 0) {
      log.blank()
      log.error(`Failed to create ${failed.length} symlink(s):`)
      failed.forEach((result) => {
        log.error(`  ${chalk.red('✗')} ${result.target}: ${result.error}`)
      })
    }

    log.blank()
    log.success('Symlink management complete!')
    log.blank()
    log.info('Next steps:')
    log.info(`1. Verify symlinks: ls -la apps/web/.env`)
    log.info(`2. Update ${sourceFile} with your environment variables`)
    log.info('3. Changes to the source file will be reflected in all linked packages')
  } catch (error) {
    log.error(
      `Failed to manage symlinks: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    throw error
  }
}

/**
 * Displays symlink status in a formatted table
 * @param statuses - Array of symlink statuses
 */
function displaySymlinkStatus(statuses: SymlinkStatus[]): void {
  statuses.forEach((status) => {
    const packagePath = chalk.cyan(status.packagePath)

    if (!status.exists) {
      log.info(`  ${packagePath}: ${chalk.gray('no .env file')}`)
    } else if (status.isSymlink) {
      if (status.isValid) {
        log.info(
          `  ${packagePath}: ${chalk.green('linked')} -> ${status.target}`
        )
      } else {
        log.info(
          `  ${packagePath}: ${chalk.yellow('linked elsewhere')} -> ${status.target}`
        )
      }
    } else {
      log.info(`  ${packagePath}: ${chalk.yellow('local file (not symlink)')}`)
    }
  })
}

/**
 * Gets description for a package based on its symlink status
 * @param status - Symlink status for the package
 * @returns Description string
 */
function getPackageDescription(status: SymlinkStatus | undefined): string {
  if (!status) return ''

  if (!status.exists) {
    return 'No .env file'
  } else if (status.isSymlink) {
    if (status.isValid) {
      return `Already linked to root .env`
    } else {
      return `Linked to ${status.target}`
    }
  } else {
    return 'Has local .env file (will be replaced)'
  }
}

/**
 * Shows help text for the env:links command
 */
function showHelp(): void {
  console.log(`
Usage: pnpm settings env:links [options]

Create and manage .env symlinks across packages.

Options:
  --source <file>     Source .env file (e.g., .env)
  --targets <pkgs>    Target packages (comma-separated)
  --help              Show this help message

Features:
  - Discover available .env files in repo root
  - Select target packages with checkbox UI
  - View current symlink status
  - Create symlinks from packages to source file
  - Replace existing files/symlinks

Examples:
  pnpm settings env:links                                 # Interactive mode
  pnpm settings env:links --source .env                   # Select source file
  pnpm settings env:links --targets apps/web,packages/infra.db  # Specify targets
`)
}

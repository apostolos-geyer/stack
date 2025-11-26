/**
 * Database provider switch command
 * @description Switches the monorepo to use a different database provider
 */

import { select, confirm } from '@inquirer/prompts'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { getProvider, getProviderChoices, type ProviderConfig, type LocalDevOption } from '../providers/index.ts'
import { ensureDirectoriesCommitted, createBackups, restoreBackups, type Backup } from '../safety/index.ts'
import { generateFileDiff, displayMultipleDiffs } from '../diff/index.ts'
import { updateDatasourceProvider, ensurePrisma7Generator, removeDatasourceUrl } from '../schema/index.ts'
import {
  updateCfgEnvForProvider,
  syncTurboEnv,
  createSymlinks,
  generateEnv,
  checkMissingEnvVars,
} from '../env/index.ts'
import { DEFAULT_SYMLINK_TARGETS, PATHS, GIT_PROTECTED_PACKAGES } from '../utils/paths.ts'
import { execStreaming } from '../utils/exec.ts'
import { log } from '../utils/logger.ts'
import { launchPrismaDev } from '../utils/prisma-dev.ts'
import { ensureSystemDependencies } from '../utils/system-deps.ts'

/**
 * Options for the database switch command
 */
export interface DbSwitchOptions {
  /** Direct provider selection (skip prompt) */
  provider?: string
  /** Local dev option (prisma-dev, docker, remote, etc.) */
  local?: string
  /** Preview changes without applying */
  dryRun?: boolean
  /** Skip confirmation prompts */
  yes?: boolean
  /** Show help */
  help?: boolean
}

/**
 * Database provider switch command
 * @description Switches the monorepo to use a different database provider
 *
 * This command performs the following operations:
 * 1. Validates git status (all files must be committed)
 * 2. Prompts for provider and local dev configuration
 * 3. Generates diffs for all modified files
 * 4. Shows preview of changes
 * 5. Applies changes and runs installation steps
 *
 * @param options - Command options
 * @throws Error if git has uncommitted changes or user cancels operation
 */
export async function dbSwitch(options: DbSwitchOptions): Promise<void> {
  // Show help if requested
  if (options.help) {
    showHelp()
    return
  }

  log.header('Database Provider Switch')

  // Step 1: Check git status
  log.step(1, 10, 'Checking git status...')
  try {
    await ensureDirectoriesCommitted([...GIT_PROTECTED_PACKAGES])
  } catch (error) {
    log.error('Git check failed. Please commit your changes before proceeding.')
    throw error
  }

  // Step 2: Select provider
  log.step(2, 10, 'Selecting database provider...')
  let providerId = options.provider

  if (!providerId) {
    providerId = await select({
      message: 'Which database provider do you want to use?',
      choices: getProviderChoices(),
    })
  }

  const provider = getProvider(providerId)
  if (!provider) {
    throw new Error(`Invalid provider: ${providerId}`)
  }

  log.success(`Selected provider: ${provider.displayName}`)

  // Step 3: Select local dev option
  log.step(3, 10, 'Configuring local development...')
  let localDevType = options.local

  if (!localDevType) {
    if (provider.localDevOptions.length === 1) {
      // Auto-select when there's only one option
      localDevType = provider.localDevOptions[0].type
      log.info(`Auto-selected: ${provider.localDevOptions[0].label}`)
    } else {
      localDevType = await select({
        message: 'How do you want to run the database locally?',
        choices: provider.localDevOptions.map((opt) => ({
          name: opt.label,
          value: opt.type,
          description: opt.description,
        })),
      })
    }
  }

  const localDevOption = provider.localDevOptions.find(
    (opt) => opt.type === localDevType
  )
  if (!localDevOption) {
    throw new Error(`Invalid local dev option: ${localDevType}`)
  }

  log.success(`Local dev: ${localDevOption.label}`)

  // Step 4: Check system dependencies
  log.step(4, 10, 'Checking system dependencies...')
  if (localDevOption.systemDeps && localDevOption.systemDeps.length > 0) {
    try {
      ensureSystemDependencies(localDevOption.systemDeps)
    } catch (error) {
      log.error('Cannot proceed without required system dependencies.')
      throw error
    }
  } else {
    log.info('No system dependencies required')
  }

  // Step 5: Run provider setup (derives/prompts for env vars)
  log.step(5, 10, 'Running provider setup...')
  const setupResult = await provider.setup(localDevOption, {
    log,
    skipPrompts: options.yes ?? false,
  })
  const dbEnvVars = setupResult.envVars

  // Step 6: Generate diffs
  log.step(6, 10, 'Generating diffs...')
  const diffs: Array<{ filePath: string; diff: string }> = []

  try {
    // Generate diff for client.ts
    const clientDiff = await generateFileDiff(
      PATHS.DB_CLIENT_TS,
      provider.templates.clientTs
    )
    if (clientDiff) {
      diffs.push({ filePath: PATHS.DB_CLIENT_TS, diff: clientDiff })
    }

    // Generate diff for prisma.config.ts
    const prismaConfigDiff = await generateFileDiff(
      PATHS.DB_PRISMA_CONFIG,
      provider.templates.prismaConfigTs
    )
    if (prismaConfigDiff) {
      diffs.push({ filePath: PATHS.DB_PRISMA_CONFIG, diff: prismaConfigDiff })
    }

    // Generate diff for auth.ts adapter (patch only the provider line)
    const currentAuthContent = await readFile(PATHS.AUTH_TS, 'utf-8')
    const patchedAuthContent = patchAuthContent(currentAuthContent, provider)
    const authDiff = await generateFileDiff(PATHS.AUTH_TS, patchedAuthContent)
    if (authDiff) {
      diffs.push({ filePath: PATHS.AUTH_TS, diff: authDiff })
    }

    // Generate diff for package.json scripts
    const currentPackageJson = await readFile(PATHS.DB_PACKAGE_JSON, 'utf-8')
    const patchedPackageJson = patchPackageJsonScripts(currentPackageJson, localDevOption)
    const packageJsonDiff = await generateFileDiff(PATHS.DB_PACKAGE_JSON, patchedPackageJson)
    if (packageJsonDiff) {
      diffs.push({ filePath: PATHS.DB_PACKAGE_JSON, diff: packageJsonDiff })
    }

    // Generate .env with ALL vars (existing values preserved, db vars merged in)
    const existingEnvContent = existsSync(PATHS.ENV)
      ? await readFile(PATHS.ENV, 'utf-8')
      : ''
    const envContent = await generateEnv(existingEnvContent, dbEnvVars)
    const envDiff = await generateFileDiff(PATHS.ENV, envContent)
    if (envDiff) {
      diffs.push({ filePath: PATHS.ENV, diff: envDiff })
    }

    // Generate diff for schema.prisma (provider change, remove deprecated url field)
    const currentSchemaContent = await readFile(PATHS.DB_SCHEMA_PRISMA, 'utf-8')
    let patchedSchemaContent = updateDatasourceProvider(currentSchemaContent, provider.prismaProvider)
    patchedSchemaContent = ensurePrisma7Generator(patchedSchemaContent)
    patchedSchemaContent = removeDatasourceUrl(patchedSchemaContent)
    const schemaDiff = await generateFileDiff(PATHS.DB_SCHEMA_PRISMA, patchedSchemaContent)
    if (schemaDiff) {
      diffs.push({ filePath: PATHS.DB_SCHEMA_PRISMA, diff: schemaDiff })
    }

    // Generate diff for README.md
    const readmeContent = generateReadmeContent(provider, localDevOption)
    const readmeDiff = await generateFileDiff(PATHS.DB_README, readmeContent)
    if (readmeDiff) {
      diffs.push({ filePath: PATHS.DB_README, diff: readmeDiff })
    }

    // Generate diff for docker-compose.yml (if provider uses Docker)
    if (provider.templates.dockerComposeYml) {
      const dockerComposeDiff = await generateFileDiff(
        PATHS.DB_DOCKER_COMPOSE,
        provider.templates.dockerComposeYml
      )
      if (dockerComposeDiff) {
        diffs.push({ filePath: PATHS.DB_DOCKER_COMPOSE, diff: dockerComposeDiff })
      }
    }

    // Generate diff for cfg.env server.ts (provider-specific env vars)
    const currentCfgEnvContent = await readFile(PATHS.CFG_ENV_SERVER, 'utf-8')
    const patchedCfgEnvContent = updateCfgEnvForProvider(currentCfgEnvContent, provider.id)
    const cfgEnvDiff = await generateFileDiff(PATHS.CFG_ENV_SERVER, patchedCfgEnvContent)
    if (cfgEnvDiff) {
      diffs.push({ filePath: PATHS.CFG_ENV_SERVER, diff: cfgEnvDiff })
    }

    log.success(`Generated ${diffs.length} diffs`)
  } catch (error) {
    log.error('Failed to generate diffs')
    throw error
  }

  // Step 6: Display diffs
  if (diffs.length > 0) {
    log.header('Preview Changes')
    displayMultipleDiffs(diffs)
  } else {
    log.info('No changes needed for code files')
  }

  // If dry run, stop here
  if (options.dryRun) {
    log.blank()
    log.info('Dry run mode - no changes applied')
    log.info('Run without --dry-run to apply changes')
    return
  }

  // Step 8: Confirm and apply changes
  log.step(7, 10, 'Applying changes...')

  if (!options.yes) {
    const confirmed = await confirm({
      message: 'Apply these changes?',
      default: true,
    })

    if (!confirmed) {
      log.warn('Operation cancelled by user')
      return
    }
  }

  // Create backups of all files we'll modify
  const filesToModify = [
    PATHS.DB_CLIENT_TS,
    PATHS.DB_PRISMA_CONFIG,
    PATHS.AUTH_TS,
    PATHS.DB_PACKAGE_JSON,
    PATHS.DB_SCHEMA_PRISMA,
    PATHS.DB_README,
    PATHS.CFG_ENV_SERVER,
    PATHS.TURBO_JSON,
  ]
  // Only backup .env if it exists
  if (existsSync(PATHS.ENV)) {
    filesToModify.push(PATHS.ENV)
  }
  // Only backup docker-compose.yml if it exists
  if (existsSync(PATHS.DB_DOCKER_COMPOSE)) {
    filesToModify.push(PATHS.DB_DOCKER_COMPOSE)
  }

  let backups: Backup[] = []

  try {
    log.info('Creating backups...')
    backups = await createBackups(filesToModify)
    log.success(`Created ${backups.length} backups`)
  } catch (error) {
    log.error('Failed to create backups')
    throw error
  }

  // Apply file changes (with rollback on any error)
  try {
    // Update client.ts
    await writeFile(PATHS.DB_CLIENT_TS, provider.templates.clientTs, 'utf-8')
    log.success('Updated client.ts')

    // Update prisma.config.ts
    await writeFile(PATHS.DB_PRISMA_CONFIG, provider.templates.prismaConfigTs, 'utf-8')
    log.success('Updated prisma.config.ts')

    // Update auth.ts (only the provider line)
    const currentAuthContent = await readFile(PATHS.AUTH_TS, 'utf-8')
    const patchedAuthContent = patchAuthContent(currentAuthContent, provider)
    await writeFile(PATHS.AUTH_TS, patchedAuthContent, 'utf-8')
    log.success('Updated auth.ts (provider line)')

    // Update package.json scripts
    const currentPackageJson = await readFile(PATHS.DB_PACKAGE_JSON, 'utf-8')
    const patchedPackageJson = patchPackageJsonScripts(currentPackageJson, localDevOption)
    await writeFile(PATHS.DB_PACKAGE_JSON, patchedPackageJson, 'utf-8')
    log.success('Updated package.json scripts')

    // Generate .env with ALL vars (existing values preserved, db vars merged in)
    const existingEnvContent = existsSync(PATHS.ENV)
      ? await readFile(PATHS.ENV, 'utf-8')
      : ''
    const envContent = await generateEnv(existingEnvContent, dbEnvVars)
    await writeFile(PATHS.ENV, envContent, 'utf-8')
    log.success('Generated .env')

    // Check for missing required env vars
    const missingVars = await checkMissingEnvVars(envContent)
    if (missingVars.length > 0) {
      log.blank()
      log.warn('Missing required env vars in .env:')
      for (const v of missingVars) {
        log.warn(`  - ${v}`)
      }
      log.info('Run: pnpm settings env:config to configure these')
    }

    // Create symlinks from packages to root .env
    const symlinkResults = await createSymlinks('.env', [...DEFAULT_SYMLINK_TARGETS])
    const successfulSymlinks = symlinkResults.filter((r) => r.success)
    if (successfulSymlinks.length > 0) {
      log.success(`Created ${successfulSymlinks.length} symlink(s) to .env`)
    }

    // Generate README.md
    const readmeContent = generateReadmeContent(provider, localDevOption)
    await writeFile(PATHS.DB_README, readmeContent, 'utf-8')
    log.success('Generated README.md')

    // Generate docker-compose.yml (if provider uses Docker)
    if (provider.templates.dockerComposeYml) {
      await writeFile(PATHS.DB_DOCKER_COMPOSE, provider.templates.dockerComposeYml, 'utf-8')
      log.success('Generated docker-compose.yml')
    }

    // Update schema.prisma (provider change, remove deprecated url field)
    const currentSchemaContent = await readFile(PATHS.DB_SCHEMA_PRISMA, 'utf-8')
    let patchedSchemaContent = updateDatasourceProvider(currentSchemaContent, provider.prismaProvider)
    patchedSchemaContent = ensurePrisma7Generator(patchedSchemaContent)
    patchedSchemaContent = removeDatasourceUrl(patchedSchemaContent)
    await writeFile(PATHS.DB_SCHEMA_PRISMA, patchedSchemaContent, 'utf-8')
    log.success('Updated schema.prisma')

    // Update cfg.env server.ts (provider-specific env vars)
    const currentCfgEnvContent = await readFile(PATHS.CFG_ENV_SERVER, 'utf-8')
    const patchedCfgEnvContent = updateCfgEnvForProvider(currentCfgEnvContent, provider.id)
    await writeFile(PATHS.CFG_ENV_SERVER, patchedCfgEnvContent, 'utf-8')
    log.success('Updated cfg.env/server.ts')

    // Sync turbo.json globalEnv with cfg.env schema
    const syncResult = await syncTurboEnv()
    if (syncResult.added.length > 0 || syncResult.removed.length > 0) {
      log.success(`Synced turbo.json (added: ${syncResult.added.length}, removed: ${syncResult.removed.length})`)
    } else {
      log.info('turbo.json already in sync')
    }
  } catch (error) {
    log.error('Failed to apply changes, rolling back...')
    try {
      await restoreBackups(backups)
      log.success('Restored all files from backup')
    } catch (restoreError) {
      log.error(`Failed to restore backups: ${restoreError instanceof Error ? restoreError.message : 'Unknown error'}`)
    }
    throw error
  }

  // Step 9: Install dependencies
  log.step(8, 10, 'Installing dependencies...')

  try {
    // Remove old adapter dependencies first
    if (provider.dependencies.remove.length > 0) {
      log.info(`Removing old dependencies: ${provider.dependencies.remove.join(', ')}`)
      const removeExitCode = await execStreaming('pnpm', [
        '--filter',
        '@_/infra.db',
        'remove',
        ...provider.dependencies.remove,
      ])
      // Don't fail if packages weren't installed - that's fine
      if (removeExitCode !== 0) {
        log.warn('Some packages may not have been installed - continuing')
      }
    }

    // Add new adapter dependencies
    const depsToAdd = Object.entries(provider.dependencies.add).map(
      ([pkg, version]) => `${pkg}@${version}`
    )
    if (depsToAdd.length > 0) {
      log.info(`Adding dependencies: ${depsToAdd.join(', ')}`)
      const addExitCode = await execStreaming('pnpm', [
        '--filter',
        '@_/infra.db',
        'add',
        ...depsToAdd,
      ])
      if (addExitCode !== 0) {
        throw new Error('Failed to add dependencies')
      }
    }

    log.info('Running pnpm install...')
    const exitCode = await execStreaming('pnpm', ['install'])
    if (exitCode !== 0) {
      throw new Error(`pnpm install failed with exit code ${exitCode}`)
    }

    log.info('Running prisma generate...')
    const genExitCode = await execStreaming('pnpm', ['--filter', '@_/infra.db', 'db:generate'])
    if (genExitCode !== 0) {
      throw new Error(`prisma generate failed with exit code ${genExitCode}`)
    }

    log.success('Dependencies installed successfully')
  } catch (error) {
    log.error('Failed to install dependencies')
    throw error
  }

  // Step 10: Handle migrations
  log.step(9, 10, 'Setting up migrations...')

  let shouldRunMigration = true

  // Check for existing migrations that need to be removed
  if (existsSync(PATHS.DB_MIGRATIONS)) {
    log.warn('Existing migrations directory found')
    log.info('When switching database providers, existing migrations are incompatible')
    log.info('and must be removed to create fresh migrations for the new provider.')
    log.blank()

    if (!options.yes) {
      const removeMigrations = await confirm({
        message: 'Remove existing migrations directory?',
        default: true,
      })

      if (removeMigrations) {
        await rm(PATHS.DB_MIGRATIONS, { recursive: true })
        log.success('Removed migrations directory')
      } else {
        log.warn('Keeping existing migrations - skipping initial migration')
        log.warn('This may cause issues with the new provider')
        shouldRunMigration = false
      }
    } else {
      // Auto mode: remove migrations
      await rm(PATHS.DB_MIGRATIONS, { recursive: true })
      log.success('Removed migrations directory')
    }
  }

  // Run initial migration (unless user kept old migrations)
  if (shouldRunMigration) {
    // For prisma-postgres, start the server before migrating
    let prismaDevServer: Awaited<ReturnType<typeof launchPrismaDev>> | null = null
    if (provider.id === 'prisma-postgres' && localDevOption.type === 'prisma-dev') {
      log.info('Starting Prisma Dev for migration...')
      try {
        prismaDevServer = await launchPrismaDev('template')
      } catch (error) {
        log.warn('Could not start Prisma Dev - migration may fail')
      }
    }

    log.info('Running initial migration...')
    const migrateExitCode = await execStreaming('pnpm', [
      '--filter',
      '@_/infra.db',
      'db:migrate:dev',
      '--name',
      'init',
    ])
    if (migrateExitCode !== 0) {
      log.warn('Migration failed - you may need to start your database first')
      log.info('Run: pnpm --filter @_/infra.db db:start')
      log.info('Then: pnpm --filter @_/infra.db db:migrate:dev --name init')
    } else {
      log.success('Initial migration complete')
    }

    // Stop the server after migration (user can start it again with pnpm dev)
    if (prismaDevServer) {
      await prismaDevServer.stop()
    }
  }

  // Step 11: Show next steps
  log.step(10, 10, 'Complete!')
  log.blank()
  log.header('Next Steps')

  let stepNum = 1

  // Only show "start database" if migration failed (database wasn't running)
  if (localDevOption.type === 'docker') {
    log.info(`${stepNum}. Start the database: pnpm --filter @_/infra.db db:start`)
    stepNum++
  } else if (localDevOption.type === 'supabase-local') {
    log.info(`${stepNum}. Start Supabase: pnpm --filter @_/infra.db db:start`)
    stepNum++
  } else if (localDevOption.type === 'prisma-dev') {
    log.info(`${stepNum}. Start Prisma Dev: pnpm --filter @_/infra.db dev`)
    stepNum++
  } else if (localDevOption.type === 'remote') {
    log.info(`${stepNum}. Update .env with your remote connection strings`)
    stepNum++
  }

  // If user kept old migrations, they need to handle migrations manually
  if (!shouldRunMigration) {
    log.info(`${stepNum}. Run migrations: pnpm --filter @_/infra.db db:migrate:dev --name init`)
    stepNum++
  }

  log.info(`${stepNum}. Start your app: pnpm dev`)

  log.blank()
  log.info('Documentation:')
  log.info(`  Prisma: ${provider.docs.prisma}`)
  log.info(`  Provider: ${provider.docs.provider}`)
  log.blank()
  log.success('Database provider switch complete!')
}

/**
 * Patches auth.ts to use the correct database adapter provider
 * Only changes the provider line, preserving all other code
 * @param currentContent - Current auth.ts content
 * @param provider - Provider configuration
 * @returns Patched auth.ts content
 */
function patchAuthContent(currentContent: string, provider: ProviderConfig): string {
  const newProvider = provider.authAdapterProvider

  // Match provider: "sqlite" or provider: "postgresql" (with various quote styles)
  const providerRegex = /provider:\s*["'](?:sqlite|postgresql)["']/g

  if (!providerRegex.test(currentContent)) {
    // If no provider found, return unchanged
    return currentContent
  }

  // Replace the provider value
  return currentContent.replace(
    /provider:\s*["'](?:sqlite|postgresql)["']/g,
    `provider: "${newProvider}"`
  )
}

/**
 * Patches package.json to include provider-specific scripts
 * @param currentContent - Current package.json content
 * @param localDevOption - Selected local development option
 * @returns Patched package.json content
 */
function patchPackageJsonScripts(currentContent: string, localDevOption: LocalDevOption): string {
  const pkg = JSON.parse(currentContent)

  // Merge the new scripts, preserving existing ones that aren't overridden
  pkg.scripts = {
    ...pkg.scripts,
    ...localDevOption.packageJsonScripts,
    // Always keep these standard scripts
    'db:generate': 'prisma generate',
    'db:migrate:dev': 'prisma migrate dev',
    'db:migrate:deploy': 'prisma migrate deploy',
    'db:push': 'prisma db push',
    typecheck: 'tsc --noEmit',
  }

  return JSON.stringify(pkg, null, 2) + '\n'
}

/**
 * Generates README.md content for the database package
 * @param provider - Provider configuration
 * @param localDevOption - Selected local development option
 * @returns README.md content string
 */
function generateReadmeContent(
  provider: ProviderConfig,
  localDevOption: LocalDevOption
): string {
  const envVarTable = provider.productionEnvVars
    .map((v) => `| \`${v.name}\` | ${v.description} | ${v.required ? 'Yes' : 'No'} |`)
    .join('\n')

  // Build scripts documentation based on what's available
  const scriptsDoc = Object.entries(localDevOption.packageJsonScripts)
    .map(([name, cmd]) => `pnpm ${name.replace(/^db:/, '')}  # ${cmd}`)
    .join('\n')

  return `# Database Package (@_/infra.db)

This package uses **${provider.displayName}** with Prisma 7.

${provider.readme.quickstart}

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
${envVarTable}

## Local Development

**Selected method:** ${localDevOption.label}

${localDevOption.description}

## Commands

\`\`\`bash
pnpm db:generate    # Regenerate Prisma client
pnpm db:migrate:dev # Run migrations
pnpm db:studio      # Open Prisma Studio
\`\`\`

## Official Documentation

- [Prisma + ${provider.displayName}](${provider.docs.prisma})
- [${provider.displayName} Docs](${provider.docs.provider})

${provider.readme.troubleshooting}
`
}

/**
 * Shows help text for the db:switch command
 */
function showHelp(): void {
  console.log(`
Usage: pnpm settings db:switch [options]

Switch database provider for the monorepo.

Options:
  --provider <name>   Provider: sqlite, prisma-postgres, postgres, turso, supabase, neon
  --local <method>    Local dev: prisma-dev, docker, remote, supabase-local, xdg-file
  --dry-run           Preview changes without applying
  --yes               Skip confirmation prompts
  --help              Show this help message

Examples:
  pnpm settings db:switch                        # Interactive mode
  pnpm settings db:switch --provider postgres    # PostgreSQL with Docker
  pnpm settings db:switch --provider supabase    # Supabase with local stack
  pnpm settings db:switch --dry-run              # Preview only
  pnpm settings db:switch --yes                  # Auto-confirm all prompts
`)
}

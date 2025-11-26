/**
 * Environment configuration command
 * @description Interactive prompt to view/edit environment variables
 */

import { select, input, confirm } from '@inquirer/prompts'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import {
  extractEnvVarNames,
  addEnvVarsToSchema,
  removeEnvVarsFromSchema,
  parseEnvSchema,
  generateEnv,
  checkMissingEnvVars,
  generateSecret,
  ENV_VAR_DEFAULTS,
  type EnvVarDefinition,
} from '../env/index.ts'
import { syncTurboEnv, parseEnvContent } from '../env/index.ts'
import { generateFileDiff } from '../diff/index.ts'
import { displayDiff } from '../diff/index.ts'
import { log } from '../utils/logger.ts'
import { PATHS } from '../utils/paths.ts'

/**
 * Options for the environment configuration command
 */
export interface EnvConfigOptions {
  /** Show help */
  help?: boolean
}

/**
 * Environment configuration command
 * @description Interactive prompt to view/edit environment variables in platform schema
 *
 * This command allows you to:
 * - View current environment variables
 * - Add new environment variables
 * - Remove existing environment variables
 * - Sync turbo.json with platform schema
 *
 * @param options - Command options
 *
 * @example
 * ```typescript
 * // Interactive mode
 * await envConfig({})
 * ```
 */
export async function envConfig(options: EnvConfigOptions): Promise<void> {
  // Show help if requested
  if (options.help) {
    showHelp()
    return
  }

  log.header('Environment Variable Configuration')

  try {
    // Read current platform schema
    const currentContent = await readFile(PATHS.CFG_ENV_SERVER, 'utf-8')
    const currentVars = extractEnvVarNames(currentContent)

    // Show current variables
    log.info('Current environment variables:')
    currentVars.forEach((varName) => {
      log.info(`  ${varName}`)
    })
    log.blank()

    // Main menu loop
    let done = false
    let modifiedContent = currentContent

    while (!done) {
      const action = await select({
        message: 'What would you like to do?',
        choices: [
          {
            name: 'Set values for environment variables',
            value: 'set-values',
            description: 'Configure values in .env',
          },
          {
            name: 'Add new variable to schema',
            value: 'add',
            description: 'Add a new environment variable to the schema',
          },
          {
            name: 'Remove variable from schema',
            value: 'remove',
            description: 'Remove an environment variable from the schema',
          },
          {
            name: 'View schema changes',
            value: 'view',
            description: 'Preview schema changes before applying',
          },
          {
            name: 'Apply schema changes',
            value: 'apply',
            description: 'Save schema changes and sync turbo.json',
          },
          {
            name: 'Exit',
            value: 'cancel',
            description: 'Exit configuration',
          },
        ],
      })

      switch (action) {
        case 'set-values':
          await handleSetValues()
          break

        case 'add':
          modifiedContent = await handleAddVariable(modifiedContent)
          break

        case 'remove':
          modifiedContent = await handleRemoveVariable(modifiedContent)
          break

        case 'view':
          await handleViewChanges(currentContent, modifiedContent)
          break

        case 'apply':
          await handleApplyChanges(currentContent, modifiedContent)
          done = true
          break

        case 'cancel':
          log.warn('Cancelled without saving changes')
          done = true
          break
      }
    }
  } catch (error) {
    log.error(
      `Failed to configure environment: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    throw error
  }
}

/**
 * Handles setting values for environment variables in .env
 * Prompts user for each variable and writes to .env
 */
async function handleSetValues(): Promise<void> {
  log.blank()
  log.header('Set Environment Variable Values')

  // Read or create .env
  let envContent = ''
  if (existsSync(PATHS.ENV)) {
    envContent = await readFile(PATHS.ENV, 'utf-8')
  }

  // If empty, generate template first
  if (!envContent.trim()) {
    log.info('Creating .env with all schema variables...')
    envContent = await generateEnv()
    await writeFile(PATHS.ENV, envContent, 'utf-8')
    log.success('Created .env')
  }

  // Parse current values
  const currentValues = parseEnvContent(envContent)

  // Get all schema vars
  const schemaVars = await parseEnvSchema()

  // Group vars by category for better UX
  const categories = [
    { name: 'Better Auth', filter: (v: string) => v.startsWith('BETTER_AUTH') },
    { name: 'Stripe', filter: (v: string) => v.startsWith('STRIPE') },
    { name: 'Email', filter: (v: string) => v.startsWith('RESEND') || v.startsWith('EMAIL') },
    { name: 'OAuth - Google', filter: (v: string) => v.startsWith('GOOGLE') },
    { name: 'OAuth - GitHub', filter: (v: string) => v.startsWith('GITHUB') },
    { name: 'OAuth - Discord', filter: (v: string) => v.startsWith('DISCORD') },
    { name: 'OAuth - Apple', filter: (v: string) => v.startsWith('APPLE') },
    { name: 'Database', filter: (v: string) => v.startsWith('DATABASE') || v.startsWith('DIRECT') || v.startsWith('TURSO') || v === 'USE_LOCAL_DB' },
  ]

  // Ask which category to configure
  const categoryChoice = await select({
    message: 'Which variables do you want to configure?',
    choices: [
      { name: 'All required variables', value: 'required', description: 'Only variables that are required' },
      { name: 'All variables', value: 'all', description: 'Configure all environment variables' },
      ...categories.map(c => ({
        name: c.name,
        value: c.name,
        description: `Configure ${c.name} variables`,
      })),
      { name: 'Go back', value: 'back' },
    ],
  })

  if (categoryChoice === 'back') {
    return
  }

  // Filter vars based on choice
  let varsToSet = schemaVars
  if (categoryChoice === 'required') {
    varsToSet = schemaVars.filter(v => !v.isOptional)
  } else if (categoryChoice !== 'all') {
    const category = categories.find(c => c.name === categoryChoice)
    if (category) {
      varsToSet = schemaVars.filter(v => category.filter(v.name))
    }
  }

  if (varsToSet.length === 0) {
    log.info('No variables to configure in this category')
    return
  }

  log.blank()
  log.info(`Configuring ${varsToSet.length} variable(s)...`)
  log.info('Press Enter to keep current value, or type a new value.')
  log.blank()

  const newValues: Record<string, string> = { ...currentValues }

  for (const v of varsToSet) {
    const currentValue = currentValues[v.name] || ''
    const defaults = ENV_VAR_DEFAULTS[v.name]

    // Auto-generate secrets
    if (defaults?.autoGenerate) {
      if (!currentValue || currentValue.startsWith('#')) {
        const generated = generateSecret()
        newValues[v.name] = generated
        log.success(`${v.name}: Auto-generated`)
      } else {
        newValues[v.name] = currentValue
        log.info(`${v.name}: Keeping existing value`)
      }
      continue
    }

    const placeholder = defaults?.example || ''

    // Show current value or placeholder
    let defaultDisplay = currentValue
    if (!currentValue || currentValue.startsWith('#')) {
      defaultDisplay = placeholder
    }

    const description = defaults?.comment || v.comment || ''
    if (description) {
      log.info(`# ${description}`)
    }

    const value = await input({
      message: `${v.name}${v.isOptional ? ' (optional)' : ''}:`,
      default: defaultDisplay,
    })

    newValues[v.name] = value
  }

  // Write updated .env
  const lines: string[] = [
    '# Environment Configuration',
    '# Generated by: pnpm settings env:config',
    '',
  ]

  for (const v of schemaVars) {
    const value = newValues[v.name] || ''
    const defaults = ENV_VAR_DEFAULTS[v.name]

    // Add comment if available
    if (defaults?.comment) {
      lines.push(`# ${defaults.comment}`)
    }

    // Format value
    if (value.startsWith('#') || !value) {
      lines.push(`${v.name}=${value || ''}`)
    } else if (value.includes(' ') || value.includes('"')) {
      lines.push(`${v.name}="${value.replace(/"/g, '\\"')}"`)
    } else {
      lines.push(`${v.name}=${value}`)
    }
    lines.push('')
  }

  await writeFile(PATHS.ENV, lines.join('\n'), 'utf-8')
  log.blank()
  log.success('Updated .env')

  // Check for still-missing required vars
  const missing = await checkMissingEnvVars(lines.join('\n'))
  if (missing.length > 0) {
    log.blank()
    log.warn('Still missing required values:')
    missing.forEach(v => log.warn(`  - ${v}`))
  }
}

/**
 * Handles adding a new environment variable
 * @param currentContent - Current platform/src/server.ts content
 * @returns Modified content with new variable added
 */
async function handleAddVariable(currentContent: string): Promise<string> {
  log.blank()
  log.header('Add Environment Variable')

  // Get variable name
  const name = await input({
    message: 'Variable name (e.g., API_KEY):',
    validate: (value) => {
      if (!value) return 'Variable name is required'
      if (!/^[A-Z][A-Z0-9_]*$/.test(value)) {
        return 'Variable name must be UPPER_SNAKE_CASE (e.g., API_KEY)'
      }

      // Check if variable already exists
      const existingVars = extractEnvVarNames(currentContent)
      if (existingVars.includes(value)) {
        return `Variable ${value} already exists`
      }

      return true
    },
  })

  // Get Zod type
  const zodType = await select({
    message: 'Variable type:',
    choices: [
      {
        name: 'String',
        value: 'z.string()',
        description: 'Any string value',
      },
      {
        name: 'String (non-empty)',
        value: 'z.string().min(1)',
        description: 'String that cannot be empty',
      },
      {
        name: 'URL',
        value: 'z.string().url()',
        description: 'Valid URL format',
      },
      {
        name: 'Number',
        value: 'z.coerce.number()',
        description: 'Numeric value (coerced from string)',
      },
      {
        name: 'Boolean',
        value: 'z.coerce.boolean()',
        description: 'Boolean value (coerced from string)',
      },
      {
        name: 'Email',
        value: 'z.string().email()',
        description: 'Valid email address',
      },
      {
        name: 'Custom',
        value: 'custom',
        description: 'Enter custom Zod expression',
      },
    ],
  })

  let finalZodType = zodType
  if (zodType === 'custom') {
    finalZodType = await input({
      message: 'Enter Zod expression (e.g., z.string().min(1)):',
      validate: (value) => {
        if (!value.startsWith('z.')) {
          return 'Zod expression must start with "z."'
        }
        return true
      },
    })
  }

  // Is optional?
  const optional = await confirm({
    message: 'Is this variable optional?',
    default: false,
  })

  // Add comment?
  const addComment = await confirm({
    message: 'Add a comment?',
    default: true,
  })

  let comment: string | undefined
  if (addComment) {
    comment = await input({
      message: 'Comment:',
    })
  }

  // Create variable definition
  const varDef: EnvVarDefinition = {
    name,
    zodType: finalZodType,
    optional,
    comment,
  }

  // Add to content
  const updated = addEnvVarsToSchema(currentContent, [varDef])
  log.success(`Added ${name} to schema`)

  return updated
}

/**
 * Handles removing an environment variable
 * @param currentContent - Current platform/src/server.ts content
 * @returns Modified content with variable removed
 */
async function handleRemoveVariable(currentContent: string): Promise<string> {
  log.blank()
  log.header('Remove Environment Variable')

  const existingVars = extractEnvVarNames(currentContent)

  if (existingVars.length === 0) {
    log.warn('No environment variables to remove')
    return currentContent
  }

  // Select variable to remove
  const varName = await select({
    message: 'Which variable do you want to remove?',
    choices: existingVars.map((name) => ({
      name,
      value: name,
    })),
  })

  // Confirm removal
  const confirmed = await confirm({
    message: `Are you sure you want to remove ${varName}?`,
    default: false,
  })

  if (!confirmed) {
    log.warn('Removal cancelled')
    return currentContent
  }

  // Remove from content
  const updated = removeEnvVarsFromSchema(currentContent, [varName])
  log.success(`Removed ${varName} from schema`)

  return updated
}

/**
 * Handles viewing changes
 * @param originalContent - Original platform/src/server.ts content
 * @param modifiedContent - Modified content
 */
async function handleViewChanges(
  originalContent: string,
  modifiedContent: string
): Promise<void> {
  log.blank()
  log.header('Preview Changes')

  const diff = await generateFileDiff(PATHS.CFG_ENV_SERVER, modifiedContent)

  if (!diff || diff.trim() === '') {
    log.info('No changes to preview')
    return
  }

  displayDiff(diff)
  log.blank()
}

/**
 * Handles applying changes
 * @param originalContent - Original platform/src/server.ts content
 * @param modifiedContent - Modified content
 */
async function handleApplyChanges(
  originalContent: string,
  modifiedContent: string
): Promise<void> {
  log.blank()
  log.header('Apply Changes')

  // Check if there are any changes
  if (originalContent === modifiedContent) {
    log.info('No changes to apply')
    return
  }

  // Show diff
  const diff = await generateFileDiff(PATHS.CFG_ENV_SERVER, modifiedContent)
  if (diff) {
    displayDiff(diff)
    log.blank()
  }

  // Confirm
  const confirmed = await confirm({
    message: 'Apply these changes?',
    default: true,
  })

  if (!confirmed) {
    log.warn('Changes not applied')
    return
  }

  try {
    // Write changes to platform/src/server.ts
    await writeFile(PATHS.CFG_ENV_SERVER, modifiedContent, 'utf-8')
    log.success('Updated platform/src/server.ts')

    // Sync turbo.json
    log.info('Syncing turbo.json...')
    const syncResult = await syncTurboEnv()

    if (syncResult.added.length > 0) {
      log.success(`Added ${syncResult.added.length} vars to turbo.json`)
      syncResult.added.forEach((varName) => {
        log.info(`  + ${varName}`)
      })
    }

    if (syncResult.removed.length > 0) {
      log.success(`Removed ${syncResult.removed.length} vars from turbo.json`)
      syncResult.removed.forEach((varName) => {
        log.info(`  - ${varName}`)
      })
    }

    if (syncResult.added.length === 0 && syncResult.removed.length === 0) {
      log.info('turbo.json already in sync')
    }

    log.blank()
    log.success('Environment configuration updated!')
    log.blank()
    log.info('Next steps:')
    log.info('1. Update your .env files with the new variables')
    log.info('2. Restart your development server')
  } catch (error) {
    log.error('Failed to apply changes')
    throw error
  }
}

/**
 * Shows help text for the env:config command
 */
function showHelp(): void {
  console.log(`
Usage: pnpm settings env:config [options]

Configure environment variables in the platform schema.

Options:
  --help              Show this help message

Features:
  - View current environment variables
  - Add new variables with Zod validation
  - Remove existing variables
  - Automatically sync turbo.json
  - Preview changes before applying

Examples:
  pnpm settings env:config              # Interactive mode
`)
}

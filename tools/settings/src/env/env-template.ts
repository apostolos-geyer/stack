/**
 * @fileoverview Environment file template generation
 * Generates .env based on cfg.env schema
 */

import { readFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { PATHS } from '../utils/paths.ts'

/**
 * Generates a cryptographically secure random secret
 * @param length - Length in bytes (default 32, results in 44 char base64)
 */
export function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('base64')
}

/**
 * Parsed environment variable from cfg.env schema
 */
export interface ParsedEnvVar {
  name: string
  zodType: string
  isOptional: boolean
  comment?: string
  defaultValue?: string
}

/**
 * Default values and examples for common env vars
 */
export const ENV_VAR_DEFAULTS: Record<string, { example: string; comment: string; autoGenerate?: boolean }> = {
  // Auth
  BETTER_AUTH_SECRET: {
    example: '# Auto-generated',
    comment: 'Better Auth secret key (min 32 chars) - auto-generated',
    autoGenerate: true,
  },
  BETTER_AUTH_URL: {
    example: 'http://localhost:3000',
    comment: 'Better Auth base URL',
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    example: 'sk_test_...',
    comment: 'Stripe secret key (test mode for development)',
  },
  STRIPE_WEBHOOK_SECRET: {
    example: 'whsec_...',
    comment: 'Stripe webhook signing secret',
  },

  // Email
  RESEND_API_KEY: {
    example: 're_...',
    comment: 'Resend API key for sending emails',
  },
  EMAIL_FROM: {
    example: 'noreply@example.com',
    comment: 'Default sender email address',
  },

  // OAuth providers
  GOOGLE_CLIENT_ID: {
    example: '# Get from Google Cloud Console',
    comment: 'Google OAuth client ID',
  },
  GOOGLE_CLIENT_SECRET: {
    example: '# Get from Google Cloud Console',
    comment: 'Google OAuth client secret',
  },
  GITHUB_CLIENT_ID: {
    example: '# Get from GitHub Developer Settings',
    comment: 'GitHub OAuth client ID',
  },
  GITHUB_CLIENT_SECRET: {
    example: '# Get from GitHub Developer Settings',
    comment: 'GitHub OAuth client secret',
  },
  DISCORD_CLIENT_ID: {
    example: '# Get from Discord Developer Portal',
    comment: 'Discord OAuth client ID',
  },
  DISCORD_CLIENT_SECRET: {
    example: '# Get from Discord Developer Portal',
    comment: 'Discord OAuth client secret',
  },
  APPLE_CLIENT_ID: {
    example: '# Get from Apple Developer Portal',
    comment: 'Apple OAuth client ID',
  },
  APPLE_CLIENT_SECRET: {
    example: '# Get from Apple Developer Portal',
    comment: 'Apple OAuth client secret',
  },

  // Database (filled in by db:switch)
  DATABASE_URL: {
    example: '# Set by db:switch command',
    comment: 'Database connection string',
  },
  DIRECT_URL: {
    example: '# Direct connection for migrations (Supabase/Neon)',
    comment: 'Direct database URL for migrations',
  },
  TURSO_DATABASE_URL: {
    example: 'libsql://your-db.turso.io',
    comment: 'Turso database URL',
  },
  TURSO_AUTH_TOKEN: {
    example: '# Get from Turso CLI',
    comment: 'Turso authentication token',
  },
  TURSO_DB_NAME: {
    example: 'my-db',
    comment: 'Turso database name (for CLI migrations)',
  },
  USE_LOCAL_DB: {
    example: 'true',
    comment: 'Use local database instead of remote (Neon)',
  },

  // Node
  NODE_ENV: {
    example: 'development',
    comment: 'Node environment',
  },
}

/**
 * Parses the cfg.env/src/server.ts file to extract all env var definitions
 */
export async function parseEnvSchema(): Promise<ParsedEnvVar[]> {
  const content = await readFile(PATHS.CFG_ENV_SERVER, 'utf-8')
  const vars: ParsedEnvVar[] = []

  // Match the server object content
  const serverMatch = content.match(/server:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s)
  if (!serverMatch) {
    throw new Error('Could not find server object in cfg.env schema')
  }

  const serverContent = serverMatch[1]
  const lines = serverContent.split('\n')

  let currentComment: string | undefined

  for (const line of lines) {
    const trimmed = line.trim()

    // Capture comments
    if (trimmed.startsWith('//')) {
      currentComment = trimmed.slice(2).trim()
      continue
    }

    // Match variable definition: NAME: z.type()...
    const varMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*):\s*(z\.[^,]+),?$/)
    if (varMatch) {
      const [, name, zodType] = varMatch
      const isOptional = zodType.includes('.optional()')

      vars.push({
        name,
        zodType,
        isOptional,
        comment: currentComment,
      })

      currentComment = undefined
    }
  }

  return vars
}

/**
 * Generates .env content with ALL env vars from schema
 * @param existingContent - Optional existing .env content to preserve values from
 * @param dbVars - Optional database-specific vars to include/override
 */
export async function generateEnv(
  existingContent?: string,
  dbVars?: Record<string, string>
): Promise<string> {
  const schemaVars = await parseEnvSchema()
  const existingVars = existingContent ? parseExistingEnv(existingContent) : {}

  // Merge db vars into existing vars (db vars take priority)
  if (dbVars) {
    Object.assign(existingVars, dbVars)
  }

  const lines: string[] = [
    '# Environment Configuration',
    '# Generated by: pnpm settings',
    '',
  ]

  // Group vars by category
  const categories: Record<string, ParsedEnvVar[]> = {
    'Database': [],
    'Better Auth': [],
    'Stripe': [],
    'Email': [],
    'OAuth Providers': [],
    'Node': [],
    'Other': [],
  }

  const schemaVarNames = new Set(schemaVars.map(v => v.name))

  for (const v of schemaVars) {
    // Auto-generate secrets for new files
    const defaults = ENV_VAR_DEFAULTS[v.name]
    if (defaults?.autoGenerate && !existingVars[v.name]) {
      existingVars[v.name] = generateSecret()
    }

    if (v.name.startsWith('DATABASE') || v.name.startsWith('DIRECT') || v.name.startsWith('TURSO') || v.name === 'USE_LOCAL_DB') {
      categories['Database'].push(v)
    } else if (v.name.startsWith('BETTER_AUTH')) {
      categories['Better Auth'].push(v)
    } else if (v.name.startsWith('STRIPE')) {
      categories['Stripe'].push(v)
    } else if (v.name.startsWith('RESEND') || v.name.startsWith('EMAIL')) {
      categories['Email'].push(v)
    } else if (v.name.includes('CLIENT_ID') || v.name.includes('CLIENT_SECRET')) {
      categories['OAuth Providers'].push(v)
    } else if (v.name === 'NODE_ENV') {
      categories['Node'].push(v)
    } else {
      categories['Other'].push(v)
    }
  }

  // Add any dbVars that aren't in the current schema (schema update pending)
  if (dbVars) {
    for (const name of Object.keys(dbVars)) {
      if (!schemaVarNames.has(name)) {
        categories['Database'].push({ name, zodType: 'z.string()', isOptional: false })
      }
    }
  }

  // Generate content by category
  for (const [category, vars] of Object.entries(categories)) {
    if (vars.length === 0) continue

    lines.push(`# ${category}`)

    for (const v of vars) {
      const defaults = ENV_VAR_DEFAULTS[v.name]
      const existingValue = existingVars[v.name]

      // Use existing value if present, otherwise use default/example
      let value: string
      if (existingValue !== undefined) {
        value = existingValue
      } else if (defaults?.example) {
        value = defaults.example
      } else {
        value = v.isOptional ? '' : '# REQUIRED - set this value'
      }

      // Add comment
      const comment = defaults?.comment || v.comment
      if (comment && !value.startsWith('#')) {
        lines.push(`# ${comment}`)
      }

      // Format the value
      if (value.startsWith('#')) {
        lines.push(`${v.name}=${value}`)
      } else if (value.includes(' ') || value.includes('"')) {
        lines.push(`${v.name}="${value.replace(/"/g, '\\"')}"`)
      } else {
        lines.push(`${v.name}=${value}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}


/**
 * Parses existing .env file content into key-value pairs
 */
function parseExistingEnv(content: string): Record<string, string> {
  const vars: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) {
      const [, key, value] = match
      // Remove surrounding quotes
      vars[key] = value.replace(/^["']|["']$/g, '')
    }
  }

  return vars
}

/**
 * Checks which required env vars are missing from .env.development
 */
export async function checkMissingEnvVars(envContent: string): Promise<string[]> {
  const schemaVars = await parseEnvSchema()
  const existingVars = parseExistingEnv(envContent)

  const missing: string[] = []

  for (const v of schemaVars) {
    if (v.isOptional) continue

    const value = existingVars[v.name]
    if (!value || value.startsWith('#')) {
      missing.push(v.name)
    }
  }

  return missing
}

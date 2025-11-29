/**
 * Settings CLI Commands
 * @description Export all available commands with their help text
 */

// Command exports
export { dbSwitch, type DbSwitchOptions } from './db-switch.ts'
export { envConfig, type EnvConfigOptions } from './env-config.ts'
export { envLinks, type EnvLinksOptions } from './env-links.ts'

/**
 * Help text constants for all commands
 */
export const HELP = {
  /**
   * Help text for db:switch command
   */
  DB_SWITCH: `
Usage: pnpm settings db:switch [options]

Switch database provider for the monorepo.

This command performs a complete provider switch:
  1. Validates git status (files must be committed)
  2. Prompts for provider selection
  3. Configures local development setup
  4. Generates and displays diffs for all modified files
  5. Updates client.ts, prisma.config.ts, auth.ts, and schema.prisma
  6. Installs/removes dependencies
  7. Runs prisma generate

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
  pnpm settings db:switch --dry-run              # Preview changes only
  pnpm settings db:switch --yes                  # Auto-confirm all prompts

Next Steps (after switching):
  1. Configure DATABASE_URL in .env (if needed)
  2. Start your database (Docker, Supabase CLI, or Prisma Dev)
  3. Run migrations: pnpm --filter @_/db db:migrate:dev --name init
  4. Start your app: pnpm dev

Providers:
  sqlite            - Local SQLite file database (XDG data directory)
  prisma-postgres   - Prisma PostgreSQL with PgLite local development
  postgres          - PostgreSQL with Docker Compose
  turso             - Turso edge database with libSQL
  supabase          - Supabase PostgreSQL with local stack
  neon              - Neon serverless PostgreSQL (remote)
`,

  /**
   * Help text for env:config command
   */
  ENV_CONFIG: `
Usage: pnpm settings env:config [options]

Configure environment variables in the platform schema.

This command provides an interactive interface to:
  - View all current environment variables
  - Add new variables with Zod validation types
  - Remove existing variables
  - Preview changes before applying
  - Automatically sync turbo.json globalEnv

Options:
  --help              Show this help message

Features:
  - Interactive menu with add/remove/view/apply options
  - Built-in Zod type templates (string, number, url, email, boolean, etc.)
  - Custom Zod expression support
  - Optional variables with .optional() chain
  - Comment support for documentation
  - Automatic turbo.json synchronization

Examples:
  pnpm settings env:config              # Interactive mode

Workflow:
  1. View current variables
  2. Add/remove variables as needed
  3. Preview changes with diff
  4. Apply changes (writes to platform/src/server.ts)
  5. turbo.json is automatically synced

Supported Zod Types:
  - z.string()                    - Any string
  - z.string().min(1)             - Non-empty string
  - z.string().url()              - Valid URL
  - z.string().email()            - Valid email
  - z.coerce.number()             - Number (coerced from string)
  - z.coerce.boolean()            - Boolean (coerced from string)
  - Custom expression             - Any valid Zod chain

After Configuration:
  1. Update your .env files with new variables
  2. Restart your development server
  3. TypeScript will enforce the new schema
`,

  /**
   * Help text for env:links command
   */
  ENV_LINKS: `
Usage: pnpm settings env:links [options]

Create and manage .env symlinks across packages.

This command helps you manage environment file symlinks:
  1. Discovers all .env files in repo root
  2. Shows current symlink status for all packages
  3. Allows selection of source file and target packages
  4. Creates symlinks from packages to the source file

Options:
  --source <file>     Source .env file (e.g., .env)
  --targets <pkgs>    Target packages (comma-separated)
  --help              Show this help message

Features:
  - Visual display of current symlink status
  - Checkbox UI for package selection
  - Default targets pre-selected (apps/web, packages/db, packages/features)
  - Automatic replacement of existing files/symlinks
  - Validation of source file and target packages

Examples:
  pnpm settings env:links                                 # Interactive mode
  pnpm settings env:links --source .env                   # Specify source file
  pnpm settings env:links --targets apps/web,packages/db  # Specify targets

Symlink Status Indicators:
  ✓ linked              - Correctly linked to root .env
  ⚠ linked elsewhere    - Symlink points to different file
  ⚠ local file          - Real file (not a symlink)
  ○ no .env file        - No .env file exists

Benefits:
  - Single source of truth for environment variables
  - Changes to source file automatically reflected in all packages
  - No need to duplicate .env files across packages
  - Git can ignore package .env files (they're just symlinks)

After Creating Symlinks:
  1. Verify: ls -la apps/web/.env
  2. Update source file with your variables
  3. All linked packages will use the same environment
`,
}

/**
 * Display general help for the settings CLI
 */
export function showGeneralHelp(): void {
  console.log(`
Settings CLI - Database and Environment Configuration Tool

Available Commands:
  db:switch     Switch database provider (sqlite, supabase, neon, etc.)
  env:config    Configure environment variables in platform schema
  env:links     Manage .env symlinks across packages

Usage:
  pnpm settings <command> [options]

Examples:
  pnpm settings db:switch --help       # Show help for db:switch
  pnpm settings env:config             # Configure environment variables
  pnpm settings env:links              # Manage .env symlinks

Global Options:
  --help                               # Show help for a command

For detailed help on a specific command, run:
  pnpm settings <command> --help

Documentation:
  See tools/settings/docs/commands.md for comprehensive documentation
`)
}

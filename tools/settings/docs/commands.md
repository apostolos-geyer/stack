# Settings CLI Commands

Comprehensive documentation for all Settings CLI commands.

## Table of Contents

- [Overview](#overview)
- [Commands](#commands)
  - [db:switch](#dbswitch)
  - [env:config](#envconfig)
  - [env:links](#envlinks)
- [Architecture](#architecture)
- [Examples](#examples)

## Overview

The Settings CLI provides three main commands for managing database providers and environment configuration across the monorepo:

1. **db:switch** - Switch database providers with automatic migration
2. **env:config** - Manage environment variables in the cfg.env schema
3. **env:links** - Create and manage .env symlinks across packages

All commands support both interactive and non-interactive modes, with comprehensive help text available via `--help`.

## Commands

### db:switch

Switch database provider for the monorepo with automatic code generation and migration.

#### Usage

```bash
pnpm settings db:switch [options]
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `--provider <name>` | string | Provider ID: sqlite, prisma-postgres, turso, supabase, neon |
| `--local <method>` | string | Local dev method: prisma-dev, docker, remote, supabase-local |
| `--dry-run` | boolean | Preview changes without applying |
| `--yes` | boolean | Skip confirmation prompts |
| `--help` | boolean | Show help message |

#### Available Providers

- **sqlite** - Local SQLite file database
- **prisma-postgres** - Prisma PostgreSQL (development database)
- **turso** - Turso (libSQL edge database)
- **supabase** - Supabase hosted PostgreSQL
- **neon** - Neon serverless PostgreSQL

#### Local Development Options

Each provider supports different local development methods:

**SQLite:**
- `xdg-file` - Use XDG data directory for local dev.db

**PostgreSQL Providers (Prisma, Supabase, Neon):**
- `prisma-dev` - Use Prisma's built-in dev database
- `docker` - Run PostgreSQL in Docker container
- `remote` - Connect to remote cloud database
- `supabase-local` - Use Supabase CLI (supabase-only)

#### Workflow

1. **Git Safety Check** - Ensures all protected files are committed
2. **Provider Selection** - Interactive or via `--provider` flag
3. **Local Dev Configuration** - Choose how to run database locally
4. **Production Env Vars** - Configure production environment variables
5. **Diff Generation** - Shows preview of all file changes
6. **Confirmation** - User confirms changes (or auto-confirm with `--yes`)
7. **File Updates** - Updates client.ts, prisma.config.ts, auth.ts, schema.prisma
8. **Dependency Installation** - Installs/removes packages via pnpm
9. **Prisma Generate** - Regenerates Prisma client

#### Files Modified

- `/packages/infra.db/src/client.ts` - Prisma client with adapter
- `/packages/infra.db/prisma.config.ts` - Prisma configuration
- `/packages/infra.db/prisma/schema.prisma` - Database schema
- `/packages/infra.auth/src/auth.ts` - Better-auth adapter configuration
- `/packages/infra.db/package.json` - Dependencies

#### Examples

```bash
# Interactive mode (prompts for all options)
pnpm settings db:switch

# Select specific provider
pnpm settings db:switch --provider supabase

# Preview changes without applying
pnpm settings db:switch --provider neon --dry-run

# Non-interactive mode (no prompts)
pnpm settings db:switch --provider supabase --local docker --yes

# Full example with all options
pnpm settings db:switch \
  --provider neon \
  --local docker \
  --yes
```

#### Post-Switch Steps

After switching providers:

1. Configure `DATABASE_URL` in `.env.local`
2. Start your database:
   - Docker: `docker-compose up -d`
   - Supabase CLI: `supabase start`
   - Prisma Dev: `pnpm --filter @_/infra.db db:migrate:dev`
3. Run migrations: `pnpm --filter @_/infra.db db:migrate:dev --name init`
4. Start your app: `pnpm dev`

#### Error Handling

The command will fail if:
- Git working directory has uncommitted changes
- Invalid provider ID is specified
- Invalid local dev option is specified
- File write permissions are denied
- pnpm install fails
- Prisma generate fails

All errors are logged with clear messages and the operation is aborted safely.

---

### env:config

Configure environment variables in the cfg.env Zod schema with interactive UI.

#### Usage

```bash
pnpm settings env:config [options]
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `--help` | boolean | Show help message |

#### Features

- View all current environment variables
- Add new variables with Zod validation types
- Remove existing variables
- Preview changes with unified diff
- Automatically sync turbo.json globalEnv
- Support for optional variables
- Comment/documentation support

#### Workflow

1. **View Current Variables** - Displays all variables from cfg.env schema
2. **Interactive Menu** - Choose action: add, remove, view, apply, or cancel
3. **Add Variable** - Prompts for name, type, optional flag, comment
4. **Remove Variable** - Select variable to remove with confirmation
5. **View Changes** - Shows unified diff of changes
6. **Apply Changes** - Writes to cfg.env/src/server.ts and syncs turbo.json

#### Supported Zod Types

Built-in type templates:
- `z.string()` - Any string value
- `z.string().min(1)` - Non-empty string
- `z.string().url()` - Valid URL format
- `z.string().email()` - Valid email address
- `z.coerce.number()` - Numeric value (coerced from string)
- `z.coerce.boolean()` - Boolean value (coerced from string)
- Custom expression - Any valid Zod chain

#### Variable Naming Rules

- Must be UPPER_SNAKE_CASE (e.g., `API_KEY`, `DATABASE_URL`)
- Must start with uppercase letter
- Can contain uppercase letters, numbers, and underscores
- Cannot duplicate existing variable names

#### Files Modified

- `/packages/cfg.env/src/server.ts` - Zod schema definition
- `/turbo.json` - globalEnv array (auto-synced)

#### Examples

```bash
# Interactive mode
pnpm settings env:config
```

#### Example Session

```
Environment Variable Configuration

Current environment variables:
  DATABASE_URL
  BETTER_AUTH_SECRET
  BETTER_AUTH_URL
  NODE_ENV

What would you like to do?
> Add new variable

Add Environment Variable

Variable name (e.g., API_KEY): STRIPE_SECRET_KEY

Variable type:
> String (non-empty)

Is this variable optional? No

Add a comment? Yes

Comment: Stripe API secret key for payment processing

Added STRIPE_SECRET_KEY to schema

What would you like to do?
> View changes

Preview Changes
--- packages/cfg.env/src/server.ts
+++ packages/cfg.env/src/server.ts
@@ -10,6 +10,9 @@
     BETTER_AUTH_URL: z.string().url(),
     NODE_ENV: z.enum(['development', 'production', 'test']),
+
+    // Stripe API secret key for payment processing
+    STRIPE_SECRET_KEY: z.string().min(1),
   },
 })

What would you like to do?
> Apply changes

Apply these changes? Yes

Updated cfg.env/src/server.ts
Syncing turbo.json...
Added 1 vars to turbo.json
  + STRIPE_SECRET_KEY

Environment configuration updated!

Next steps:
1. Update your .env files with the new variables
2. Restart your development server
```

#### Post-Configuration Steps

After adding/removing variables:

1. Update your `.env` files with new variables
2. Restart your development server
3. TypeScript will enforce the new schema automatically

---

### env:links

Create and manage .env symlinks across packages in the monorepo.

#### Usage

```bash
pnpm settings env:links [options]
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `--source <file>` | string | Source .env file (e.g., .env.local) |
| `--targets <pkgs>` | string | Target packages (comma-separated) |
| `--help` | boolean | Show help message |

#### Features

- Discover all .env.* files in repo root
- View current symlink status for all packages
- Checkbox UI for package selection
- Default targets pre-selected (apps/web, packages/infra.db, packages/infra.auth)
- Automatic replacement of existing files/symlinks
- Validation of source file and target packages

#### Workflow

1. **Discover .env Files** - Scans repo root for .env.* files
2. **Select Source File** - Choose which .env file to use as source
3. **Discover Packages** - Finds all packages in monorepo
4. **Show Current Status** - Displays symlink status for each package
5. **Select Targets** - Checkbox UI for package selection
6. **Create Symlinks** - Creates relative symlinks from packages to source

#### Symlink Status Indicators

- ✓ **linked** - Correctly linked to root .env
- ⚠ **linked elsewhere** - Symlink points to different file
- ⚠ **local file** - Real file (not a symlink)
- ○ **no .env file** - No .env file exists

#### Default Targets

These packages are pre-selected by default:
- `apps/web`
- `packages/infra.db`
- `packages/infra.auth`

#### Files Created

Symlinks created in each target package:
- `<package>/.env` → `../../.env.local` (or chosen source)

#### Examples

```bash
# Interactive mode (prompts for all options)
pnpm settings env:links

# Specify source file
pnpm settings env:links --source .env.local

# Non-interactive mode
pnpm settings env:links \
  --source .env.local \
  --targets apps/web,packages/infra.db,packages/infra.auth
```

#### Example Session

```
Environment Symlink Management

[1/4] Discovering .env files...
Found 2 .env file(s)

[2/4] Selecting source file...
Which .env file should be the source?
> .env.local
  .env.production

Source: .env.local

[3/4] Discovering packages...
Found 8 package(s)

Current symlink status:
  apps/web: no .env file
  apps/native: no .env file
  packages/infra.db: local file (not symlink)
  packages/infra.auth: linked -> ../../.env.local
  packages/api.trpc: no .env file
  packages/api.http: no .env file
  packages/lib.server: no .env file
  packages/cfg.env: no .env file

Select packages for symlink creation:
  [x] apps/web
  [ ] apps/native
  [x] packages/infra.db
  [x] packages/infra.auth
  [ ] packages/api.trpc
  [ ] packages/api.http
  [ ] packages/lib.server
  [ ] packages/cfg.env

[4/4] Creating symlinks...

Will create symlinks:
  apps/web/.env -> .env.local
  packages/infra.db/.env -> .env.local
  packages/infra.auth/.env -> .env.local

Create these symlinks? Yes

Results

Created 3 symlink(s):
  ✓ apps/web/.env
  ✓ packages/infra.db/.env
  ✓ packages/infra.auth/.env

Symlink management complete!

Next steps:
1. Verify symlinks: ls -la apps/web/.env
2. Update .env.local with your environment variables
3. Changes to the source file will be reflected in all linked packages
```

#### Benefits

- **Single source of truth** - One .env file for all packages
- **Automatic sync** - Changes propagate to all linked packages
- **Git-friendly** - Symlinks can be ignored, source file tracked
- **DRY principle** - No duplication of environment variables

#### Post-Creation Steps

After creating symlinks:

1. Verify symlinks: `ls -la apps/web/.env`
2. Update source file with your variables
3. All linked packages will use the same environment

---

## Architecture

### Command Structure

Each command follows the same pattern:

```typescript
// 1. Define options interface
export interface CommandOptions {
  help?: boolean
  // ... other options
}

// 2. Main command function
export async function command(options: CommandOptions): Promise<void> {
  // Show help if requested
  if (options.help) {
    showHelp()
    return
  }

  // Execute command logic
  // ...
}

// 3. Help function
function showHelp(): void {
  console.log(`...`)
}
```

### Module Dependencies

Commands use the following modules:

- **providers/** - Database provider configurations
- **safety/** - Git safety checks and backups
- **diff/** - Diff generation and display
- **env/** - Environment management (symlinks, cfg.env, turbo.json)
- **schema/** - Prisma schema patching
- **utils/** - Logging, exec, paths

### Safety Features

All commands implement safety features:

1. **Git Status Checks** - Ensures files are committed before modification
2. **Backup Creation** - Creates backups before dangerous operations
3. **Diff Preview** - Shows changes before applying
4. **User Confirmation** - Requires confirmation for destructive operations
5. **Error Recovery** - Restores backups on failure

### Error Handling

All commands handle errors gracefully:

```typescript
try {
  // Command logic
} catch (error) {
  log.error(`Failed: ${error.message}`)
  throw error
}
```

---

## Examples

### Complete Workflow: Switch to Supabase

```bash
# 1. Switch database provider
pnpm settings db:switch --provider supabase --local docker

# 2. Configure DATABASE_URL
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres" >> .env.local

# 3. Start PostgreSQL
docker-compose up -d

# 4. Create symlinks
pnpm settings env:links --source .env.local --targets apps/web,packages/infra.db

# 5. Run migrations
pnpm --filter @_/infra.db db:migrate:dev --name init

# 6. Start app
pnpm dev
```

### Add Custom Environment Variables

```bash
# 1. Open env config
pnpm settings env:config

# 2. Add variables interactively
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
# - STRIPE_WEBHOOK_SECRET

# 3. Update .env.local
cat >> .env.local << EOF
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EOF

# 4. Restart dev server
pnpm dev
```

### Dry Run Provider Switch

```bash
# Preview changes without applying
pnpm settings db:switch --provider neon --dry-run

# Review the diffs
# Decide whether to proceed

# If satisfied, run without --dry-run
pnpm settings db:switch --provider neon --yes
```

---

## Best Practices

### Database Provider Switching

1. **Always commit first** - Ensure clean git working directory
2. **Use --dry-run** - Preview changes before applying
3. **Read the diffs** - Understand what will change
4. **Test migrations** - Run migrations on a test database first
5. **Update docs** - Document provider-specific setup steps

### Environment Configuration

1. **Use descriptive names** - Follow UPPER_SNAKE_CASE convention
2. **Add comments** - Document purpose of each variable
3. **Mark optional correctly** - Use .optional() for truly optional vars
4. **Choose correct types** - Use appropriate Zod validators
5. **Update .env files** - Keep .env.example in sync

### Symlink Management

1. **Use default targets** - apps/web, infra.db, infra.auth are sufficient
2. **Verify after creation** - Check symlinks with `ls -la`
3. **Single source** - Use one .env file per environment
4. **Git ignore** - Add package .env files to .gitignore
5. **Document setup** - Include symlink creation in onboarding docs

---

## Troubleshooting

### Common Issues

#### Git Not Clean
```
Error: The following files have uncommitted changes:
  - packages/infra.db/package.json

Please commit these files before proceeding.
```

**Solution:** Commit or stash your changes:
```bash
git add .
git commit -m "Save work in progress"
```

#### Invalid Provider
```
Error: Invalid provider: postgres
```

**Solution:** Use a valid provider ID:
```bash
pnpm settings db:switch --provider prisma-postgres
```

#### Symlink Creation Failed
```
Error: Source file .env.local does not exist in repo root
```

**Solution:** Create the source file first:
```bash
touch .env.local
echo "DATABASE_URL=..." >> .env.local
```

#### TypeScript Errors After Env Changes
```
Error: Property 'NEW_VAR' does not exist on type 'ServerEnv'
```

**Solution:** Restart your TypeScript server and dev server:
```bash
pnpm dev
```

---

## Related Documentation

- [Providers Documentation](./providers.md) - Database provider details
- [Environment Modules](./env-modules.md) - Environment management internals
- [Schema Modules](./schema-modules.md) - Prisma schema patching
- [Safety Modules](./safety-modules.md) - Git safety and backups
- [Diff Modules](./diff-modules.md) - Diff generation and display

# CLI Entry Point Documentation

## Overview

The Settings CLI provides a command-line interface for managing database providers and environment configuration across the monorepo. The CLI supports both interactive menu-driven workflows and direct command execution.

## Architecture

### File Structure

```
src/
├── index.ts          # Entry point with error handling
├── cli.ts            # Main CLI orchestration and routing
├── commands/
│   └── index.ts      # Command implementations
├── providers/        # Database provider configurations
├── env/              # Environment management utilities
├── schema/           # Schema management utilities
├── safety/           # Git and backup utilities
└── utils/            # Shared utilities
```

### Execution Flow

```
┌─────────────┐
│  index.ts   │  Entry point - catches errors
└──────┬──────┘
       │
       v
┌─────────────┐
│   cli.ts    │  Parses args, routes to commands
└──────┬──────┘
       │
       v
┌─────────────┐
│ commands/   │  Executes business logic
│  index.ts   │  - dbSwitch()
└─────────────┘  - envConfig()
                 - envLinks()
```

## Files

### src/index.ts

**Purpose**: Entry point with error handling

**Key Features**:
- Shebang for direct execution: `#!/usr/bin/env node`
- Catches all errors from main()
- Formats error messages with chalk
- Supports DEBUG mode for stack traces
- Clean exit codes (0 for success, 1 for error)

**Error Handling**:
```typescript
main().catch((error) => {
  console.error(chalk.red('Error: ') + error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
```

### src/cli.ts

**Purpose**: Main CLI orchestration and argument parsing

**Key Exports**:
- `main()` - Main entry point
- `parseArgs()` - Command-line argument parser

**Features**:

1. **Argument Parsing**
   - Supports flags: `--help`, `--version`
   - Supports options: `--provider=neon`, `--provider neon`
   - Converts kebab-case to camelCase
   - Boolean flags: `--skip-confirm`, `--non-interactive`

2. **Command Routing**
   ```
   pnpm settings              -> showMainMenu()
   pnpm settings db           -> showDatabaseMenu()
   pnpm settings db:switch    -> dbSwitch()
   pnpm settings env          -> showEnvironmentMenu()
   pnpm settings env:config   -> envConfig()
   pnpm settings env:links    -> envLinks()
   ```

3. **Interactive Menus**
   - Main menu with database/environment options
   - Database submenu for provider switching
   - Environment submenu for variable management

4. **Ctrl+C Handling**
   ```typescript
   process.on('SIGINT', () => {
     console.log(chalk.yellow('Cancelled by user'));
     process.exit(0);
   });
   ```

### src/commands/index.ts

**Purpose**: Command implementations with business logic

**Key Exports**:
- `dbSwitch(options)` - Database provider switching
- `envConfig(options)` - Environment variable configuration
- `envLinks(options)` - Symlink management
- `HELP` - Help text for each command

**Command Options Interface**:
```typescript
interface CommandOptions {
  nonInteractive?: boolean;  // Skip prompts
  provider?: string;         // Provider ID
  skipConfirm?: boolean;     // Skip confirmations
}
```

## Commands

### Database Provider Switch (db:switch)

**Interactive Flow**:
1. Safety checks (git status, backups)
2. Provider selection prompt
3. Show changes to be made
4. Confirmation prompt
5. Update dependencies
6. Update schema.prisma
7. Generate Better Auth models
8. Generate client.ts
9. Update prisma.config.json
10. Configure environment variables
11. Display next steps

**Non-Interactive Usage**:
```bash
pnpm settings db:switch --provider neon --skip-confirm
```

**Safety Features**:
- Requires clean git working directory
- Creates backup before changes
- All changes are git-reversible
- Shows diff of changes

**Code Example**:
```typescript
await dbSwitch({
  nonInteractive: true,
  provider: 'neon',
  skipConfirm: true
});
```

### Environment Configuration (env:config)

**Features**:
- Add environment variables
- Remove environment variables
- Update cfg.env Zod schema
- Sync turbo.json globalEnv

**Interactive Flow**:
1. Discover existing .env files
2. Show action menu:
   - Add variable
   - Remove variable
   - Sync turbo.json
   - Back to main menu
3. Execute selected action
4. Prompt for another action

**Add Variable Flow**:
1. Prompt for variable name (validates uppercase format)
2. Prompt for description
3. Prompt if required
4. Add to cfg.env schema
5. Sync turbo.json

### Environment Symlink Management (env:links)

**Features**:
- View current symlink status
- Create symlinks to .env files
- Remove existing symlinks
- Discover all packages

**Symlink Status Display**:
```
→ apps/web/.env -> ../../.env.local
• apps/native/.env (regular file)
○ packages/api.trpc/.env (not found)
```

**Interactive Flow**:
1. Show current symlink status
2. Show action menu:
   - Create symlinks
   - Remove symlinks
   - Refresh status
   - Back to main menu
3. Execute selected action

## Usage Examples

### Interactive Mode

```bash
# Start interactive menu
pnpm settings

# Navigate to database configuration
? What would you like to configure?
> Database Provider
  Environment Variables
  Environment Symlinks
  Exit

# Switch provider
? Select database provider:
> Neon - Neon serverless PostgreSQL database
  SQLite - Local SQLite database using libsql adapter
  Turso - Turso distributed SQLite database
```

### Direct Command Mode

```bash
# Show help
pnpm settings --help
pnpm settings db:switch --help

# Show version
pnpm settings --version

# Switch provider (interactive)
pnpm settings db:switch

# Switch provider (non-interactive)
pnpm settings db:switch --provider neon --skip-confirm

# Configure environment
pnpm settings env:config

# Manage symlinks
pnpm settings env:links
```

### Command-Line Options

**Global Options**:
- `--help, -h` - Show help message
- `--version, -v` - Show version number

**db:switch Options**:
- `--provider <id>` - Provider ID (sqlite, neon, turso, supabase, prisma-postgres)
- `--skip-confirm` - Skip confirmation prompts
- `--non-interactive` - Run without prompts

**Example**:
```bash
pnpm settings db:switch \
  --provider neon \
  --skip-confirm \
  --non-interactive
```

## Argument Parsing

### parseArgs() Function

Converts command-line arguments into structured format:

**Input Formats**:
```bash
--help                    # Boolean flag
--version                 # Boolean flag
--provider neon           # Key-value pair (space)
--provider=neon           # Key-value pair (equals)
--skip-confirm            # Boolean flag
--non-interactive         # Boolean flag
db:switch                 # Command
```

**Output Structure**:
```typescript
{
  command: 'db:switch',
  help: false,
  version: false,
  options: {
    provider: 'neon',
    skipConfirm: true,
    nonInteractive: true
  }
}
```

**Key Transformations**:
- Kebab-case → camelCase: `--skip-confirm` → `skipConfirm`
- Boolean detection: Flag without value becomes `true`
- First non-flag argument becomes command

## Error Handling

### Graceful Exits

**Ctrl+C Handling**:
```typescript
process.on('SIGINT', () => {
  console.log(chalk.yellow('Cancelled by user'));
  process.exit(0);
});
```

**Error Display**:
```bash
Error: Git working directory is not clean

# With DEBUG=1
Error: Git working directory is not clean
Stack trace:
  at ensureGitClean (/path/to/safety/git.ts:42)
  at dbSwitch (/path/to/commands/index.ts:78)
```

### Error Types

**User Errors** (clear messages):
- Git not clean: "Git working directory is not clean"
- Invalid provider: "Invalid provider: xyz"
- Missing required option: "Provider is required in non-interactive mode"

**System Errors** (with stack trace):
- File I/O errors
- Package installation failures
- Git command failures

## Help Text

### Main Help (--help)

Shows:
- Version number
- Usage syntax
- Available commands
- Global options
- Examples
- Documentation link

### Command Help (command --help)

Shows:
- Command-specific usage
- Command options
- Examples
- Safety information
- Documentation link

**Example**:
```bash
pnpm settings db:switch --help

Database Provider Switch (db:switch)

Usage:
  pnpm settings db:switch [options]

Options:
  --provider <id>     Provider ID
  --skip-confirm      Skip confirmation prompts
  --non-interactive   Run in non-interactive mode
```

## Interactive Menus

### Main Menu

```
Settings CLI
============

? What would you like to configure?
> Database Provider       Switch database provider
  Environment Variables   Configure environment variables
  Environment Symlinks    Manage .env symlinks
  Exit                    Exit Settings CLI
```

### Database Menu

```
Database Configuration
======================

? Select an action:
> Switch Provider               Change to a different database provider
  View Current Configuration    Show current database setup
  Back to Main Menu            Return to main menu
```

### Environment Menu

```
Environment Configuration
=========================

? Select an action:
> Configure Variables    Add/remove environment variables
  Manage Symlinks       Create/remove .env symlinks
  Sync turbo.json       Sync globalEnv with cfg.env schema
  Back to Main Menu     Return to main menu
```

## Integration with Other Modules

### providers/ Module

Used for:
- Getting provider choices: `getProviderChoices()`
- Getting provider config: `getProvider(id)`
- Accessing templates: `provider.templates.clientTs`

### env/ Module

Used for:
- Generating .env content: `generateEnvContent()`
- Managing symlinks: `createSymlinks()`, `removeSymlinks()`
- Updating schemas: `addEnvVarsToSchema()`
- Syncing turbo.json: `syncTurboEnv()`

### schema/ Module

Used for:
- Running Better Auth: `runBetterAuthGenerate()`
- Patching schema: `patchSchemaForProvider()`

### safety/ Module

Used for:
- Git checks: `ensureGitClean()`
- Backups: `createBackup()`

### utils/ Module

Used for:
- Logging: `log.info()`, `log.success()`, `log.error()`
- Executing commands: `exec()`
- Path resolution: `PATHS.ROOT`, `PATHS.INFRA_DB`

## Development

### Running Locally

```bash
cd /Users/stoli/Desktop/devel/personal/template-stack/template/tools/settings

# Install dependencies
pnpm install

# Run CLI
pnpm start

# Run with arguments
pnpm start -- db:switch --provider neon

# Run with debug mode
DEBUG=1 pnpm start
```

### Type Checking

```bash
pnpm typecheck
```

### Debugging

Enable debug mode to see stack traces:

```bash
DEBUG=1 pnpm settings db:switch
```

## Testing

### Manual Testing Checklist

**Interactive Mode**:
- [ ] `pnpm settings` shows main menu
- [ ] Navigation works (db, env, env-links, exit)
- [ ] Ctrl+C exits gracefully

**Help/Version**:
- [ ] `pnpm settings --help` shows help
- [ ] `pnpm settings --version` shows version
- [ ] `pnpm settings db:switch --help` shows command help

**Direct Commands**:
- [ ] `pnpm settings db:switch` runs interactively
- [ ] `pnpm settings db:switch --provider neon` works
- [ ] `pnpm settings env:config` runs interactively
- [ ] `pnpm settings env:links` runs interactively

**Error Handling**:
- [ ] Invalid command shows error
- [ ] Missing provider shows error
- [ ] Git not clean shows error

## Future Enhancements

### Planned Features

1. **Checkbox Prompts for Symlinks**
   - Allow selecting specific packages for symlinks
   - Currently defaults to "all packages"

2. **Configuration File**
   - `.settingsrc.json` for defaults
   - Provider preferences
   - Skip-confirm settings

3. **Dry Run Mode**
   - `--dry-run` flag
   - Show changes without executing

4. **Rollback Command**
   - `pnpm settings rollback`
   - Restore from backup

5. **View Current Config**
   - Implement `viewDatabaseConfig()`
   - Show current provider details
   - Show environment variables

6. **Remove Environment Variable**
   - Implement `removeEnvVar()`
   - Update cfg.env schema
   - Sync turbo.json

### Potential Improvements

1. **Progress Indicators**
   - Spinner for long operations
   - Progress bar for multi-step commands

2. **Colored Diffs**
   - Show colorized diffs for changes
   - Use diff module for comparison

3. **Validation**
   - Validate DATABASE_URL format
   - Check required env vars before switching

4. **Logging**
   - Optional log file
   - `--verbose` flag for detailed output

## Troubleshooting

### Common Issues

**Issue**: "Git working directory is not clean"
**Solution**: Commit or stash changes first
```bash
git status
git add .
git commit -m "Save work"
# or
git stash
```

**Issue**: "Invalid provider: xyz"
**Solution**: Use valid provider ID
```bash
pnpm settings db:switch --provider neon
# Valid: sqlite, neon, turso, supabase, prisma-postgres
```

**Issue**: Package installation fails
**Solution**: Check network connection, try manual install
```bash
pnpm install
```

**Issue**: Permission denied
**Solution**: Check file permissions
```bash
chmod +x node_modules/.bin/settings
```

## References

### Related Documentation
- [Providers Documentation](./providers.md)
- [Environment Modules](./env-modules.md)
- [Schema Modules](./schema-modules.md)
- [Safety Modules](./safety-modules.md)

### External Links
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts)
- [chalk](https://www.npmjs.com/package/chalk)
- [Prisma CLI](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Better Auth](https://www.better-auth.com/)

## Conclusion

The CLI entry point provides a robust, user-friendly interface for managing database providers and environment configuration. It supports both interactive and non-interactive workflows, with comprehensive error handling and safety checks.

Key design principles:
- **Safety First**: Git checks, backups, confirmations
- **User-Friendly**: Clear prompts, helpful error messages
- **Flexible**: Interactive or direct command modes
- **Well-Documented**: JSDoc comments, help text, examples

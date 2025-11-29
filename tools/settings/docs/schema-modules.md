# Schema Modules Documentation

## Overview

The schema modules provide utilities for managing Prisma schema changes during database provider switches. These modules handle Better Auth CLI integration, schema patching for different providers, and user approval workflows.

## Implementation Summary

### Module Structure

```
src/schema/
├── better-auth.ts  # Better Auth CLI integration
├── patch.ts        # Schema patching utilities
└── index.ts        # Re-exports all schema utilities
```

## Modules

### `better-auth.ts`

Provides integration with the Better Auth CLI to generate authentication models in schema.prisma.

#### Types

```typescript
interface BetterAuthResult {
  success: boolean   // Whether the Better Auth CLI ran successfully
  changes: string    // Description of changes made to the schema
  approved: boolean  // Whether user approved the changes
}
```

#### Functions

**`hasBetterAuthModels(schemaContent: string): boolean`**

Checks if Better Auth models already exist in schema.

- Looks for the four required models: User, Session, Account, Verification
- Returns `true` if all models are present
- Used to skip CLI generation if models already exist

**`runBetterAuthGenerate(schemaPath: string): Promise<BetterAuthResult>`**

Runs the Better Auth CLI to generate auth models in schema.prisma.

- Checks if models already exist (skips if present)
- Creates backup before running CLI
- Executes `npx @better-auth/cli@latest generate`
- Generates and displays diff of changes
- Requests user approval before applying changes
- Restores backup if user rejects or CLI fails
- Returns result with success status and changes description

#### Implementation Details

- **CLI Command**: `npx @better-auth/cli@latest generate`
- **Models Added**: User, Session, Account, Verification
- **Backup Strategy**: Creates backup before CLI, restores on rejection/error
- **User Workflow**: Shows diff → requests approval → applies or reverts

#### Error Handling

- Throws if Better Auth CLI fails
- Throws if user rejects changes
- Automatically restores backup on any error
- Logs all operations and errors

### `patch.ts`

Provides utilities for patching schema.prisma when switching database providers.

#### Types

```typescript
type DatabaseProvider = 'sqlite' | 'postgresql'

interface PatchResult {
  success: boolean  // Whether the patch was successful
  diff: string      // Unified diff string of changes made
  approved: boolean // Whether user approved the changes
}
```

#### Functions

**`updateDatasourceProvider(schemaContent: string, provider: DatabaseProvider): string`**

Updates the datasource provider in schema.prisma.

- Replaces provider value in the `datasource db` block
- Uses regex to find and replace provider
- Throws if datasource block not found

**`ensurePrisma7Generator(schemaContent: string): string`**

Ensures the generator block has correct Prisma 7 settings.

- Checks for old "prisma-client-js" provider (Prisma 6)
- Updates to "prisma-client" for Prisma 7 compatibility
- Returns unchanged if already correct

**`ensureDatasourceUrl(schemaContent: string): string`**

Adds URL to datasource db block if missing.

- Required for PostgreSQL connections
- Adds `url = env("DATABASE_URL")` if not present
- Returns unchanged if URL already exists

**`patchSchemaForProvider(schemaPath: string, provider: DatabaseProvider): Promise<PatchResult>`**

Applies all schema patches needed for a provider switch.

- Creates backup before making changes
- Applies all three patches:
  1. Update datasource provider
  2. Ensure Prisma 7 generator format
  3. Add datasource URL if missing
- Generates and displays diff of all changes
- Requests user approval
- Writes changes or restores backup based on approval
- Returns result with diff and approval status

#### Implementation Details

- **Patches Applied** (in order):
  1. Provider update (sqlite/postgresql)
  2. Generator update (prisma-client-js → prisma-client)
  3. URL field addition (if missing)

- **Regex Patterns**:
  - Datasource provider: `/(datasource\s+db\s*\{[^}]*provider\s*=\s*)"[^"]*"/`
  - Old generator: `/(generator\s+client\s*\{[^}]*provider\s*=\s*)"prisma-client-js"/`
  - URL check: `/datasource\s+db\s*\{[^}]*url\s*=/s`

- **Backup Strategy**: Creates backup before changes, restores on rejection/error

#### Error Handling

- Throws if schema structure is invalid (no datasource/generator)
- Throws if user rejects changes
- Automatically restores backup on any error
- Logs all operations and errors

### `index.ts`

Re-exports all schema utilities with module documentation.

```typescript
// Better Auth integration
export {
  runBetterAuthGenerate,
  hasBetterAuthModels,
  type BetterAuthResult,
} from './better-auth.js'

// Schema patching utilities
export {
  patchSchemaForProvider,
  updateDatasourceProvider,
  ensurePrisma7Generator,
  ensureDatasourceUrl,
  type DatabaseProvider,
  type PatchResult,
} from './patch.js'
```

## Usage Examples

### Running Better Auth CLI

```typescript
import { runBetterAuthGenerate } from './schema/better-auth.js'
import { PATHS } from './utils/paths.js'

try {
  const result = await runBetterAuthGenerate(PATHS.DB_SCHEMA_PRISMA)

  if (result.success) {
    console.log('✓ Better Auth models added')
    console.log('Changes:', result.changes)
  }
} catch (error) {
  console.error('Failed to add Better Auth models:', error)
}
```

### Patching Schema for Provider

```typescript
import { patchSchemaForProvider } from './schema/patch.js'
import { PATHS } from './utils/paths.js'

try {
  const result = await patchSchemaForProvider(
    PATHS.DB_SCHEMA_PRISMA,
    'postgresql'
  )

  if (result.success && result.diff) {
    console.log('✓ Schema patched for PostgreSQL')
  }
} catch (error) {
  console.error('Failed to patch schema:', error)
}
```

### Checking for Existing Models

```typescript
import { readFile } from 'node:fs/promises'
import { hasBetterAuthModels } from './schema/better-auth.js'
import { PATHS } from './utils/paths.js'

const schema = await readFile(PATHS.DB_SCHEMA_PRISMA, 'utf-8')

if (hasBetterAuthModels(schema)) {
  console.log('Better Auth models already present, skipping generation')
} else {
  console.log('Better Auth models not found, will generate')
}
```

### Individual Schema Patches

```typescript
import { readFile, writeFile } from 'node:fs/promises'
import {
  updateDatasourceProvider,
  ensurePrisma7Generator,
  ensureDatasourceUrl,
} from './schema/patch.js'

let schema = await readFile('schema.prisma', 'utf-8')

// Apply individual patches
schema = updateDatasourceProvider(schema, 'postgresql')
schema = ensurePrisma7Generator(schema)
schema = ensureDatasourceUrl(schema)

await writeFile('schema.prisma', schema)
```

## Integration with Other Modules

### Safety Module Integration

Both schema modules use the safety module for backup/restore:

```typescript
import { createBackup, restoreBackup } from '../safety/backup.js'

// Create backup before changes
const backup = await createBackup(schemaPath)

try {
  // Make changes...
  await makeChanges()
} catch (error) {
  // Restore on error
  await restoreBackup(backup)
  throw error
}
```

### Diff Module Integration

Both schema modules use diff modules to show changes:

```typescript
import { generateFileDiff } from '../diff/generator.js'
import { displayDiff } from '../diff/display.js'

// Generate and display diff
const diff = await generateFileDiff(schemaPath, modifiedContent)
displayDiff(diff)
```

### User Approval Workflow

Both modules use `@inquirer/prompts` for user approval:

```typescript
import { confirm } from '@inquirer/prompts'

const approved = await confirm({
  message: 'Apply these changes?',
  default: true,
})

if (!approved) {
  await restoreBackup(backup)
  throw new Error('Changes rejected by user')
}
```

## Auth Setup Order (CRITICAL)

When switching database providers, these steps must be executed in the correct order:

1. **Patch schema.prisma** - Update provider, generator, URL
   ```typescript
   await patchSchemaForProvider(schemaPath, 'postgresql')
   ```

2. **Generate Prisma Client** - Generate client first (required by Better Auth)
   ```bash
   pnpm --filter @_/db prisma generate
   ```

3. **Run Better Auth CLI** - Add auth models to schema
   ```typescript
   await runBetterAuthGenerate(schemaPath)
   ```

4. **Create migration** - Apply schema changes to database
   ```bash
   pnpm --filter @_/db prisma migrate dev --name init
   ```

5. **Regenerate Prisma Client** - Regenerate with auth models
   ```bash
   pnpm --filter @_/db prisma generate
   ```

**Why this order matters:**
- Better Auth CLI requires Prisma client to be available
- Migrations must be created after all schema changes
- Client must be regenerated after migrations to include new models

## Schema Validation

### Provider Detection

```typescript
function detectProvider(schemaContent: string): DatabaseProvider | null {
  const match = schemaContent.match(/datasource\s+db\s*\{[^}]*provider\s*=\s*"([^"]*)"/)
  return match ? match[1] as DatabaseProvider : null
}
```

### Generator Detection

```typescript
function isPrisma7Generator(schemaContent: string): boolean {
  return /generator\s+client\s*\{[^}]*provider\s*=\s*"prisma-client"/.test(schemaContent)
}
```

### URL Detection

```typescript
function hasDatasourceUrl(schemaContent: string): boolean {
  return /datasource\s+db\s*\{[^}]*url\s*=/s.test(schemaContent)
}
```

## Testing Considerations

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { hasBetterAuthModels, updateDatasourceProvider } from './schema/index.js'

describe('hasBetterAuthModels', () => {
  it('returns true when all models present', () => {
    const schema = `
      model User { }
      model Session { }
      model Account { }
      model Verification { }
    `
    expect(hasBetterAuthModels(schema)).toBe(true)
  })

  it('returns false when models missing', () => {
    const schema = `model User { }`
    expect(hasBetterAuthModels(schema)).toBe(false)
  })
})

describe('updateDatasourceProvider', () => {
  it('updates provider correctly', () => {
    const schema = 'datasource db { provider = "sqlite" }'
    const updated = updateDatasourceProvider(schema, 'postgresql')
    expect(updated).toContain('provider = "postgresql"')
  })
})
```

### Integration Testing

Test with actual schema.prisma files:

```typescript
import { readFile } from 'node:fs/promises'
import { patchSchemaForProvider } from './schema/index.js'

// Test with temporary schema file
const testSchemaPath = '/tmp/test-schema.prisma'
await writeFile(testSchemaPath, SAMPLE_SCHEMA)

const result = await patchSchemaForProvider(testSchemaPath, 'postgresql')
expect(result.success).toBe(true)

const updated = await readFile(testSchemaPath, 'utf-8')
expect(updated).toContain('provider = "postgresql"')
```

## Error Messages

### Better Auth Errors

- `"Better Auth CLI failed: [error]"` - CLI execution failed
- `"Better Auth schema changes rejected by user"` - User declined changes
- `"Failed to create backup for [path]"` - Backup creation failed
- `"Failed to restore backup for [path]"` - Backup restoration failed

### Patch Errors

- `"Could not find datasource provider in schema.prisma"` - Invalid schema structure
- `"Could not find datasource block in schema.prisma"` - Missing datasource
- `"Schema patch rejected by user"` - User declined changes

## Dependencies

- **`@inquirer/prompts`** - User confirmation dialogs
- **`node:fs/promises`** - File reading/writing
- **`node:child_process`** - Better Auth CLI execution via exec utility
- **Internal modules**:
  - `safety/backup.ts` - Backup/restore functionality
  - `diff/generator.ts` - Diff generation
  - `diff/display.ts` - Diff display
  - `utils/exec.ts` - Command execution
  - `utils/logger.ts` - Logging

## Future Enhancements

### Potential Improvements

1. **Dry Run Mode**: Preview changes without applying them
   ```typescript
   await patchSchemaForProvider(path, provider, { dryRun: true })
   ```

2. **Provider-Specific Patches**: Additional customization per provider
   ```typescript
   const postgresPatches = {
     addExtensions: true,
     enableUUID: true,
   }
   ```

3. **Schema Validation**: Verify schema integrity after patching
   ```typescript
   await validateSchema(schemaPath)
   ```

4. **Rollback Stack**: Support multiple levels of undo
   ```typescript
   const rollbackStack = new RollbackStack()
   rollbackStack.push(backup)
   ```

5. **Better Auth Version Detection**: Warn if Better Auth version mismatch
   ```typescript
   const betterAuthVersion = await detectBetterAuthVersion()
   if (betterAuthVersion !== EXPECTED_VERSION) {
     log.warn('Better Auth version mismatch')
   }
   ```

## Conclusion

The schema modules provide a robust, user-approved workflow for managing Prisma schema changes during database provider switches. The modules integrate seamlessly with safety and diff modules to ensure all changes are visible, approved, and reversible.

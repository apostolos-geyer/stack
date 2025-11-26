# Safety Modules Documentation

## Overview

The safety modules provide git status checking and backup/restore functionality for the Settings CLI tool. These modules ensure that file modifications can be safely performed and rolled back if needed.

## Implementation Summary

### Module Structure

```
src/safety/
├── git.ts       # Git status checking and validation
├── backup.ts    # File backup and restore operations
└── index.ts     # Re-exports all safety utilities
```

## Modules

### `git.ts`

Provides git repository validation and status checking using the `simple-git` package.

#### Types

```typescript
interface GitStatusResult {
  isGitRepo: boolean        // Whether current directory is a git repo
  uncommittedFiles: string[] // List of uncommitted files
  allCommitted: boolean      // Whether all target files are committed
}
```

#### Functions

**`checkGitStatus(files: string[]): Promise<GitStatusResult>`**

Checks git status for specified files.

- Verifies if the current directory is a git repository
- Identifies which of the specified files have uncommitted changes
- Returns detailed status information
- Converts absolute file paths to repo-relative paths for checking

**`ensureFilesCommitted(files: string[]): Promise<void>`**

Ensures all specified files are committed before proceeding.

- Calls `checkGitStatus()` internally
- Throws an error if any files have uncommitted changes
- Warns but continues if not in a git repository
- Logs success when all files are committed

#### Implementation Details

- Uses `simple-git` library for git operations
- Checks multiple git status categories:
  - Modified files
  - Not added (untracked) files
  - Created (staged new) files
  - Deleted files
  - Renamed files
  - Conflicted files
- Path normalization: Converts absolute paths to repository-relative paths for accurate checking

### `backup.ts`

Provides file backup and restore operations for safe file modifications.

#### Types

```typescript
interface Backup {
  filePath: string        // Absolute path to the backed up file
  originalContent: string // Original file content
  timestamp: number       // Unix timestamp of backup creation
}
```

#### Functions

**`createBackup(filePath: string): Promise<Backup>`**

Creates a backup of a single file.

- Reads file content using Node.js `fs/promises`
- Returns backup object with timestamp
- Throws error if file cannot be read
- Logs backup creation

**`restoreBackup(backup: Backup): Promise<void>`**

Restores a single file from a backup.

- Writes original content back to file
- Throws error if restore fails
- Logs successful restoration

**`createBackups(filePaths: string[]): Promise<Backup[]>`**

Creates backups for multiple files.

- Creates backups sequentially
- If any backup fails, automatically restores all previously created backups
- This ensures an all-or-nothing backup operation
- Returns array of successful backups

**`restoreBackups(backups: Backup[]): Promise<void>`**

Restores multiple files from backups.

- Attempts to restore all files even if some fail
- Collects all errors and reports them together
- Throws error only after attempting all restorations
- Logs progress and results

#### Implementation Details

- Uses Node.js `fs/promises` for async file operations
- Error handling includes automatic rollback on partial failures
- All operations are logged for debugging and user feedback

### `index.ts`

Re-exports all utilities for convenient importing:

```typescript
// Git utilities
export { checkGitStatus, ensureFilesCommitted, type GitStatusResult }

// Backup utilities
export { createBackup, restoreBackup, createBackups, restoreBackups, type Backup }
```

## Usage Examples

### Basic Git Status Check

```typescript
import { checkGitStatus } from './safety/index.js'

const files = [
  '/path/to/package.json',
  '/path/to/config.ts',
]

const status = await checkGitStatus(files)

if (!status.allCommitted) {
  console.log('Uncommitted files:', status.uncommittedFiles)
}
```

### Ensure Files Are Committed

```typescript
import { ensureFilesCommitted } from './safety/index.js'

try {
  await ensureFilesCommitted([
    '/path/to/critical/file.ts',
    '/path/to/another/file.ts',
  ])
  // Proceed with modifications
} catch (error) {
  console.error('Please commit your changes first')
}
```

### Backup and Restore Workflow

```typescript
import { createBackups, restoreBackups } from './safety/index.js'

const files = [
  '/path/to/file1.ts',
  '/path/to/file2.json',
]

// Create backups
const backups = await createBackups(files)

try {
  // Perform file modifications
  await modifyFiles(files)

  // Ask user to review changes
  const approved = await askUserForApproval()

  if (!approved) {
    // Restore original files
    await restoreBackups(backups)
  }
} catch (error) {
  // Restore on error
  await restoreBackups(backups)
  throw error
}
```

### Complete Safety Flow

```typescript
import { ensureFilesCommitted, createBackups, restoreBackups } from './safety/index.js'

async function safelyModifyFiles(files: string[]) {
  // Step 1: Ensure files are committed
  await ensureFilesCommitted(files)

  // Step 2: Create backups
  const backups = await createBackups(files)

  try {
    // Step 3: Modify files
    await performModifications(files)

    // Step 4: User approval
    const approved = await getUserApproval()

    if (!approved) {
      await restoreBackups(backups)
      console.log('Changes reverted')
    } else {
      console.log('Changes applied successfully')
    }
  } catch (error) {
    // Step 5: Automatic rollback on error
    await restoreBackups(backups)
    throw error
  }
}
```

## Key Design Decisions

### 1. Named Import for simple-git

**Decision**: Use `import { simpleGit } from 'simple-git'` instead of default import.

**Reason**: The `simple-git` v3+ uses named exports. This aligns with the package's TypeScript definitions and prevents type errors.

### 2. Absolute File Paths

**Decision**: All functions accept absolute file paths.

**Reason**: The CLI operates across multiple directories in a monorepo. Absolute paths eliminate ambiguity and ensure correct file operations regardless of current working directory.

### 3. Path Normalization in Git Checks

**Decision**: Convert absolute paths to repo-relative paths when checking git status.

**Reason**: Git operations work with repository-relative paths. This ensures accurate status checking when comparing against git's output.

### 4. All-or-Nothing Backup Strategy

**Decision**: If any backup fails during `createBackups()`, restore all previously created backups.

**Reason**: Prevents partial backup states that could lead to incomplete rollback operations. Ensures data integrity.

### 5. Error Collection in Restore Operations

**Decision**: In `restoreBackups()`, attempt all restorations even if some fail, then report all errors.

**Reason**: Maximizes the number of successfully restored files. Users get complete error information rather than stopping at the first failure.

### 6. Logger Integration

**Decision**: Use the existing `log` utility from `utils/logger.js` for all logging.

**Reason**: Maintains consistency with the rest of the CLI tool and provides color-coded, formatted output.

### 7. ESM Module Extensions

**Decision**: Use `.js` extensions in import statements (`from './git.js'`).

**Reason**: Required by Node.js ESM resolution when using `"type": "module"` in package.json and `"moduleResolution": "NodeNext"` in tsconfig.json.

## Issues Encountered

### 1. TypeScript Type Definitions

**Issue**: Initial compilation failed with "Cannot find type definition file for 'minimatch'".

**Resolution**: Added `@types/minimatch` as a dev dependency, though it's actually a stub since the package provides its own types. This resolved the compilation issue.

### 2. simple-git Import Syntax

**Issue**: Using default import `import simpleGit from 'simple-git'` caused type error "This expression is not callable".

**Resolution**: Changed to named import `import { simpleGit } from 'simple-git'` to match the package's export structure.

### 3. Node Modules in Workspace

**Issue**: Initial typecheck warnings about missing node_modules despite being in a pnpm workspace.

**Resolution**: Running `pnpm install` at the repository root properly linked all workspace dependencies.

## Testing Recommendations

To test these modules, consider:

1. **Git Status Tests**
   - Test with uncommitted files
   - Test with all files committed
   - Test in non-git directory
   - Test with non-existent files

2. **Backup Tests**
   - Test single file backup/restore
   - Test multiple file backup/restore
   - Test with non-existent files (should fail gracefully)
   - Test restore after partial backup failure

3. **Integration Tests**
   - Test full workflow: git check → backup → modify → restore
   - Test with actual files from the monorepo
   - Test error paths and rollback behavior

## Integration with Settings CLI

These safety modules are designed to be used by the database provider switching commands:

1. Before any file modifications, call `ensureFilesCommitted()` with the list of files from `GIT_PROTECTED_FILES` in `src/utils/paths.ts`
2. Create backups of all files that will be modified
3. Perform the file modifications
4. Show diff to user and ask for approval
5. If rejected, restore backups
6. If approved, keep changes and optionally commit them

## Future Enhancements

Possible improvements for future versions:

1. **Backup to disk**: Optionally save backups to a temporary directory for recovery after crashes
2. **Backup history**: Keep multiple backup versions with timestamps
3. **Git integration**: Automatic commit creation after successful changes
4. **Dry-run mode**: Preview changes without actually modifying files
5. **Parallel operations**: Use `Promise.all()` for faster backup/restore of many files
6. **Custom backup location**: Allow specifying where backups are stored

## Dependencies

- `simple-git`: ^3.27.0 - Git operations
- `node:fs/promises` - File system operations
- `../utils/logger.js` - Logging utilities

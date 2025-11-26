# Diff Modules Documentation

## Overview

The diff modules provide functionality for generating and displaying file diffs in the Settings CLI tool. These modules allow users to preview changes before applying them, improving safety and transparency.

## Implementation

### Files Created

1. **`src/diff/generator.ts`** - Diff generation logic
2. **`src/diff/display.ts`** - Terminal display with syntax highlighting
3. **`src/diff/index.ts`** - Public API exports

## Module Details

### generator.ts

Handles creation of unified diffs between file contents.

#### `generateDiff(oldContent, newContent, filePath)`

Creates a unified diff between two strings.

**Parameters:**
- `oldContent: string` - Original file content
- `newContent: string` - New file content
- `filePath: string` - File path to show in diff header

**Returns:** `string` - Unified diff format, or empty string if no changes

**Implementation notes:**
- Uses `createTwoFilesPatch` from the `diff` package
- Returns empty string if contents are identical (early optimization)
- Includes 3 lines of context around changes for readability

#### `generateFileDiff(filePath, newContent)`

Reads a file from disk and generates diff against new content.

**Parameters:**
- `filePath: string` - Absolute path to file
- `newContent: string` - New content to compare against

**Returns:** `Promise<string>` - Unified diff format

**Implementation notes:**
- Handles non-existent files by treating them as empty
- Gracefully handles read errors by falling back to empty content
- Useful for preview workflows where you want to show changes before writing

### display.ts

Provides terminal output with ANSI color coding.

#### `displayDiff(diff)`

Prints a single diff with syntax highlighting.

**Parameters:**
- `diff: string` - Unified diff string to display

**Color scheme:**
- **Cyan** - File headers (`---`, `+++`) and chunk headers (`@@`)
- **Green** - Added lines (start with `+`)
- **Red** - Removed lines (start with `-`)
- **Gray** - Context lines (unchanged)

**Implementation notes:**
- Silently handles empty diffs
- Line-by-line processing for color application
- Uses `chalk` for cross-platform color support

#### `displayMultipleDiffs(diffs)`

Displays multiple file diffs with visual separation.

**Parameters:**
- `diffs: Array<{filePath: string, diff: string}>` - Array of file diffs

**Features:**
- Bold, underlined file path headers
- Horizontal separators between files
- Skips empty diffs automatically
- Consistent spacing for readability

## Key Decisions

### 1. Unified Diff Format
- **Decision:** Use unified diff format (not side-by-side or other formats)
- **Rationale:**
  - Standard format recognized by developers
  - Works well in narrow terminals
  - Supported by the `diff` package out of the box
  - Includes context lines for understanding changes

### 2. Color Scheme
- **Decision:** Use semantic colors (green/red for add/remove, cyan for meta, gray for context)
- **Rationale:**
  - Matches git diff and other standard tools
  - Accessible and familiar to developers
  - Clear visual distinction between change types

### 3. Error Handling
- **Decision:** Treat missing/unreadable files as empty content
- **Rationale:**
  - Allows diff generation for new files
  - Graceful degradation on permission errors
  - Shows full file content as "additions" for new files

### 4. Empty Diff Handling
- **Decision:** Return/display empty string for identical content
- **Rationale:**
  - Avoid cluttering output with "no changes" messages
  - Caller can check for empty string to determine if changes exist
  - Performance optimization (skip expensive diff generation)

## Edge Cases Handled

1. **Non-existent files** - Treated as empty, shows entire new content as additions
2. **Empty files** - Handled correctly (empty -> content or content -> empty)
3. **Identical content** - Returns empty string immediately without diff generation
4. **Read permission errors** - Falls back to empty content
5. **Empty diff arrays** - `displayMultipleDiffs` returns early
6. **Mixed empty/non-empty diffs** - Empty diffs are skipped in batch display

## Usage Examples

### Basic Diff Generation

```typescript
import { generateDiff, displayDiff } from './diff/index.js'

const oldContent = 'Hello\nWorld\n'
const newContent = 'Hello\nUniverse\n'

const diff = generateDiff(oldContent, newContent, 'greeting.txt')
displayDiff(diff)
```

Output:
```diff
--- greeting.txt
+++ greeting.txt
@@ -1,2 +1,2 @@
 Hello
-World
+Universe
```

### File-based Diff

```typescript
import { generateFileDiff, displayDiff } from './diff/index.js'

const newContent = 'export const API_URL = "https://api.example.com"\n'
const diff = await generateFileDiff('/path/to/config.ts', newContent)

if (diff) {
  displayDiff(diff)
} else {
  console.log('No changes')
}
```

### Multiple Files Preview

```typescript
import { generateFileDiff, displayMultipleDiffs } from './diff/index.js'

const changes = [
  { path: '/path/to/file1.ts', content: 'new content 1' },
  { path: '/path/to/file2.ts', content: 'new content 2' },
]

const diffs = await Promise.all(
  changes.map(async ({ path, content }) => ({
    filePath: path,
    diff: await generateFileDiff(path, content),
  }))
)

displayMultipleDiffs(diffs)
```

### Preview Before Write Pattern

```typescript
import { generateFileDiff, displayDiff } from './diff/index.js'
import { confirm } from '@inquirer/prompts'
import { writeFile } from 'node:fs/promises'

async function safeWrite(filePath: string, newContent: string) {
  const diff = await generateFileDiff(filePath, newContent)

  if (!diff) {
    console.log('No changes to apply')
    return
  }

  console.log('\nProposed changes:')
  displayDiff(diff)

  const confirmed = await confirm({
    message: 'Apply these changes?',
    default: true,
  })

  if (confirmed) {
    await writeFile(filePath, newContent, 'utf-8')
    console.log('Changes applied!')
  } else {
    console.log('Changes discarded')
  }
}
```

## Integration Points

### With Logger Utils

The diff display module complements the existing logger utilities:

```typescript
import { log } from '../utils/logger.js'
import { displayMultipleDiffs } from '../diff/index.js'

log.header('Preview Changes')
displayMultipleDiffs(diffs)
log.divider()
```

### With Path Utils

Generator works seamlessly with path constants:

```typescript
import { PATHS } from '../utils/paths.js'
import { generateFileDiff } from '../diff/index.js'

const diff = await generateFileDiff(
  PATHS.DB_CLIENT_TS,
  newClientContent
)
```

## Issues Encountered

None. Implementation was straightforward with the existing dependencies.

## Dependencies

- **`diff`** (v7.0.0) - Unified diff generation
- **`@types/diff`** (v7.0.0) - TypeScript definitions
- **`chalk`** (v5.3.0) - Terminal color support (already in project)

## Testing Considerations

When testing these modules, consider:

1. **Empty content scenarios** - Old empty, new empty, one empty
2. **Large files** - Performance with files >1000 lines
3. **Binary files** - Behavior with non-text content
4. **Line ending differences** - CRLF vs LF handling
5. **No trailing newline** - Files missing final newline
6. **Color output** - Terminal vs piped output (chalk handles this)

## Future Enhancements

Potential improvements for future iterations:

1. **Statistics** - Show summary (X lines added, Y removed)
2. **Syntax highlighting** - Language-aware color coding within diff
3. **Word-level diffs** - Highlight changed words, not just lines
4. **Pager integration** - For large diffs, pipe through `less`
5. **Diff filtering** - Options to show only adds or only removes
6. **Custom context** - Allow configurable context line count

# Environment Modules Documentation

Comprehensive utilities for managing environment variables, configuration files, and symlinks across the monorepo.

## Overview

The environment modules provide four main areas of functionality:

1. **Generator** - Creating and parsing .env file content
2. **platform** - Managing the Zod schema in `packages/platform/src/server.ts`
3. **turbo.json** - Syncing the `globalEnv` array with platform schema
4. **Symlinks** - Managing .env symlinks across packages

## Module: generator.ts

Utilities for generating, parsing, and merging .env file content.

### Functions

#### `generateEnvContent(vars, comments?)`

Generates formatted .env file content from key-value pairs.

**Parameters:**
- `vars: Record<string, string>` - Environment variable names and values
- `comments?: Record<string, string>` - Optional comments for each variable

**Returns:** `string` - Formatted .env file content

**Example:**
```typescript
import { generateEnvContent } from './env/index.js';

const content = generateEnvContent(
  {
    DATABASE_URL: "postgresql://localhost:5432/db",
    NODE_ENV: "development"
  },
  {
    DATABASE_URL: "PostgreSQL connection string",
    NODE_ENV: "Node environment"
  }
);

console.log(content);
// Output:
// # PostgreSQL connection string
// DATABASE_URL="postgresql://localhost:5432/db"
//
// # Node environment
// NODE_ENV=development
```

**Features:**
- Automatically quotes values with spaces or special characters
- Adds blank lines between variables for readability
- Escapes quotes within quoted values

---

#### `parseEnvContent(content)`

Parses existing .env file content into key-value pairs.

**Parameters:**
- `content: string` - Raw .env file content

**Returns:** `Record<string, string>` - Parsed environment variables

**Example:**
```typescript
import { parseEnvContent } from './env/index.js';

const content = `
# Database
DATABASE_URL="postgresql://localhost:5432/db"
NODE_ENV=development
`;

const vars = parseEnvContent(content);
console.log(vars);
// { DATABASE_URL: "postgresql://localhost:5432/db", NODE_ENV: "development" }
```

**Features:**
- Ignores comments and blank lines
- Removes surrounding quotes from values
- Validates variable name format

---

#### `mergeEnvContent(existingContent, newVars)`

Merges new variables into existing .env content while preserving order and comments.

**Parameters:**
- `existingContent: string` - Current .env file content
- `newVars: Record<string, string>` - Variables to add or update

**Returns:** `string` - Updated .env file content

**Example:**
```typescript
import { mergeEnvContent } from './env/index.js';

const existing = `
# Database
DATABASE_URL="old-value"
NODE_ENV=development
`;

const merged = mergeEnvContent(existing, {
  DATABASE_URL: "new-value",
  NEW_VAR: "value"
});

// Updates DATABASE_URL, preserves NODE_ENV and comment, appends NEW_VAR
```

**Features:**
- Updates existing variables in place
- Preserves comments and blank lines
- Appends new variables at the end
- Maintains original formatting style

---

## Module: platform.ts

Functions for managing the Zod schema in `packages/platform/src/server.ts`.

### Types

#### `EnvVarDefinition`

```typescript
interface EnvVarDefinition {
  name: string;        // Variable name (e.g., "DATABASE_URL")
  zodType: string;     // Zod type (e.g., "z.string().min(1)")
  optional: boolean;   // Whether the variable is optional
  comment?: string;    // Optional comment
}
```

### Functions

#### `addEnvVarsToSchema(currentContent, vars)`

Adds new environment variables to the platform Zod schema.

**Parameters:**
- `currentContent: string` - Current content of platform/src/server.ts
- `vars: EnvVarDefinition[]` - Variables to add

**Returns:** `string` - Modified server.ts content

**Throws:** `Error` if server object cannot be found

**Example:**
```typescript
import fs from 'node:fs/promises';
import { addEnvVarsToSchema } from './env/index.js';

const content = await fs.readFile('packages/platform/src/server.ts', 'utf-8');

const updated = addEnvVarsToSchema(content, [
  {
    name: "API_KEY",
    zodType: "z.string()",
    optional: true,
    comment: "External API key"
  },
  {
    name: "API_TIMEOUT",
    zodType: "z.number().default(5000)",
    optional: false,
    comment: "API request timeout in ms"
  }
]);

await fs.writeFile('packages/platform/src/server.ts', updated);
```

**Features:**
- Maintains proper indentation and formatting
- Adds comments before variable definitions
- Handles optional vs required variables
- Inserts at the end of the server object

---

#### `removeEnvVarsFromSchema(currentContent, vars)`

Removes environment variables from the platform Zod schema.

**Parameters:**
- `currentContent: string` - Current content of platform/src/server.ts
- `vars: string[]` - Variable names to remove

**Returns:** `string` - Modified server.ts content

**Throws:** `Error` if server object cannot be found

**Example:**
```typescript
import { removeEnvVarsFromSchema } from './env/index.js';

const updated = removeEnvVarsFromSchema(content, [
  "OLD_API_KEY",
  "DEPRECATED_VAR"
]);
```

**Features:**
- Removes variable definitions and their comments
- Cleans up extra blank lines
- Preserves other variables and formatting

---

#### `extractEnvVarNames(content)`

Extracts all environment variable names from the platform schema.

**Parameters:**
- `content: string` - Content of platform/src/server.ts

**Returns:** `string[]` - Sorted array of variable names

**Throws:** `Error` if server object cannot be found

**Example:**
```typescript
import { extractEnvVarNames } from './env/index.js';

const varNames = extractEnvVarNames(content);
console.log(varNames);
// ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DATABASE_URL", ...]
```

---

## Module: turbo-json.ts

Functions for syncing the `globalEnv` array in turbo.json with the platform schema.

### Types

#### `SyncResult`

```typescript
interface SyncResult {
  added: string[];    // Variables added to globalEnv
  removed: string[];  // Variables removed from globalEnv
}
```

### Functions

#### `getGlobalEnv()`

Reads turbo.json and returns the current globalEnv array.

**Returns:** `Promise<string[]>` - Environment variable names in globalEnv

**Throws:** `Error` if turbo.json cannot be read or parsed

**Example:**
```typescript
import { getGlobalEnv } from './env/index.js';

const envVars = await getGlobalEnv();
console.log(envVars);
// ["DATABASE_URL", "NODE_ENV", ...]
```

---

#### `syncTurboEnv()`

Updates turbo.json's globalEnv to match the platform schema.

**Returns:** `Promise<SyncResult>` - Added and removed variables

**Throws:** `Error` if files cannot be read/written

**Example:**
```typescript
import { syncTurboEnv } from './env/index.js';

const result = await syncTurboEnv();
console.log(`Added: ${result.added.join(', ')}`);
console.log(`Removed: ${result.removed.join(', ')}`);
```

**Workflow:**
1. Reads platform/src/server.ts to extract all variable names
2. Compares with current turbo.json globalEnv
3. Updates turbo.json with the full list from platform
4. Maintains alphabetical order
5. Returns added and removed variables

**Use Case:**
Run this after adding/removing variables in platform to keep turbo.json in sync.

---

#### `setGlobalEnv(vars)`

Directly sets the globalEnv array in turbo.json.

**Parameters:**
- `vars: string[]` - Variable names to set

**Returns:** `Promise<void>`

**Throws:** `Error` if turbo.json cannot be updated

**Example:**
```typescript
import { setGlobalEnv } from './env/index.js';

await setGlobalEnv(["DATABASE_URL", "NODE_ENV", "API_KEY"]);
```

**Use Case:**
For custom globalEnv configurations that differ from platform schema.

---

## Module: symlinks.ts

Functions for discovering and managing .env symlinks across the monorepo.

### Types

#### `SymlinkResult`

```typescript
interface SymlinkResult {
  target: string;    // Package path where symlink was created
  success: boolean;  // Whether operation succeeded
  error?: string;    // Error message if failed
}
```

#### `SymlinkStatus`

```typescript
interface SymlinkStatus {
  packagePath: string;  // Package path relative to repo root
  exists: boolean;      // Whether .env file exists
  isSymlink: boolean;   // Whether it's a symlink
  target?: string;      // Symlink target path
  isValid?: boolean;    // Whether symlink points to root .env
}
```

### Functions

#### `discoverEnvFiles()`

Discovers all .env.* files in the repository root.

**Returns:** `Promise<string[]>` - Environment file names

**Example:**
```typescript
import { discoverEnvFiles } from './env/index.js';

const envFiles = await discoverEnvFiles();
console.log(envFiles);
// [".env", ".env.local", ".env.production"]
```

**Features:**
- Excludes .env.example files
- Returns sorted list
- Only scans repo root

---

#### `discoverPackages()`

Discovers all packages/apps in the monorepo.

**Returns:** `Promise<string[]>` - Package paths relative to repo root

**Example:**
```typescript
import { discoverPackages } from './env/index.js';

const packages = await discoverPackages();
console.log(packages);
// ["apps/web", "apps/native", "packages/infra.db", ...]
```

**Features:**
- Scans apps/* and packages/* directories
- Verifies each has a package.json
- Returns sorted list

---

#### `createSymlinks(sourceFile, targets)`

Creates symlinks from packages to a root .env file.

**Parameters:**
- `sourceFile: string` - Root .env file name (e.g., ".env.local")
- `targets: string[]` - Package paths for symlinks

**Returns:** `Promise<SymlinkResult[]>` - Results for each target

**Throws:** `Error` if source file doesn't exist

**Example:**
```typescript
import { createSymlinks } from './env/index.js';

const results = await createSymlinks(".env.local", [
  "apps/web",
  "apps/native",
  "packages/infra.db"
]);

results.forEach(r => {
  if (r.success) {
    console.log(`✓ ${r.target}`);
  } else {
    console.log(`✗ ${r.target}: ${r.error}`);
  }
});
```

**Features:**
- Removes existing .env files before creating symlinks
- Uses relative paths for portability
- Handles errors gracefully per target

---

#### `getSymlinkStatus()`

Gets current symlink status for all packages.

**Returns:** `Promise<SymlinkStatus[]>` - Status for each package

**Example:**
```typescript
import { getSymlinkStatus } from './env/index.js';

const statuses = await getSymlinkStatus();

statuses.forEach(s => {
  if (!s.exists) {
    console.log(`${s.packagePath}: No .env file`);
  } else if (s.isSymlink && s.isValid) {
    console.log(`${s.packagePath}: ✓ Valid symlink`);
  } else if (s.isSymlink && !s.isValid) {
    console.log(`${s.packagePath}: ⚠ Invalid symlink -> ${s.target}`);
  } else {
    console.log(`${s.packagePath}: ⚠ Regular file (not symlink)`);
  }
});
```

**Features:**
- Scans all packages in monorepo
- Detects symlinks vs regular files
- Validates symlink targets

---

#### `removeSymlinks(targets)`

Removes .env symlinks from specified packages.

**Parameters:**
- `targets: string[]` - Package paths to remove .env from

**Returns:** `Promise<SymlinkResult[]>` - Results for each target

**Example:**
```typescript
import { removeSymlinks } from './env/index.js';

const results = await removeSymlinks([
  "apps/web",
  "packages/infra.db"
]);
```

**Features:**
- Treats non-existent files as success
- Handles errors gracefully per target

---

## Common Workflows

### 1. Add a New Environment Variable

```typescript
import fs from 'node:fs/promises';
import {
  addEnvVarsToSchema,
  syncTurboEnv,
  mergeEnvContent
} from './env/index.js';
import { PATHS } from './utils/paths.js';

// 1. Update platform schema
const cfgEnvContent = await fs.readFile(PATHS.CFG_ENV_SERVER, 'utf-8');
const updated = addEnvVarsToSchema(cfgEnvContent, [
  {
    name: "NEW_API_KEY",
    zodType: "z.string()",
    optional: true,
    comment: "New external API key"
  }
]);
await fs.writeFile(PATHS.CFG_ENV_SERVER, updated);

// 2. Sync turbo.json
const syncResult = await syncTurboEnv();
console.log(`Added to turbo.json: ${syncResult.added}`);

// 3. Update .env.local
const envContent = await fs.readFile(PATHS.ENV_LOCAL, 'utf-8');
const merged = mergeEnvContent(envContent, {
  NEW_API_KEY: "your-api-key-here"
});
await fs.writeFile(PATHS.ENV_LOCAL, merged);
```

### 2. Setup Development Environment

```typescript
import {
  generateEnvContent,
  createSymlinks,
  discoverPackages
} from './env/index.js';
import fs from 'node:fs/promises';
import { PATHS } from './utils/paths.js';

// 1. Generate .env.local
const envVars = {
  DATABASE_URL: "postgresql://localhost:5432/dev",
  BETTER_AUTH_SECRET: "your-secret-here",
  BETTER_AUTH_URL: "http://localhost:3000",
  NODE_ENV: "development"
};

const content = generateEnvContent(envVars, {
  DATABASE_URL: "Local PostgreSQL database",
  BETTER_AUTH_SECRET: "Auth secret (min 32 chars)",
  BETTER_AUTH_URL: "Application URL",
  NODE_ENV: "Node environment"
});

await fs.writeFile(PATHS.ENV_LOCAL, content);

// 2. Create symlinks for all packages
const packages = await discoverPackages();
await createSymlinks(".env.local", packages);
```

### 3. Audit Environment Configuration

```typescript
import {
  extractEnvVarNames,
  getGlobalEnv,
  getSymlinkStatus
} from './env/index.js';
import fs from 'node:fs/promises';
import { PATHS } from './utils/paths.js';

// 1. Check platform schema
const cfgEnvContent = await fs.readFile(PATHS.CFG_ENV_SERVER, 'utf-8');
const schemaVars = extractEnvVarNames(cfgEnvContent);
console.log('Variables in platform:', schemaVars);

// 2. Check turbo.json
const turboVars = await getGlobalEnv();
console.log('Variables in turbo.json:', turboVars);

// 3. Find discrepancies
const missingInTurbo = schemaVars.filter(v => !turboVars.includes(v));
const extraInTurbo = turboVars.filter(v => !schemaVars.includes(v));

if (missingInTurbo.length > 0) {
  console.log('Missing in turbo.json:', missingInTurbo);
}
if (extraInTurbo.length > 0) {
  console.log('Extra in turbo.json:', extraInTurbo);
}

// 4. Check symlinks
const statuses = await getSymlinkStatus();
const broken = statuses.filter(s => s.isSymlink && !s.isValid);
if (broken.length > 0) {
  console.log('Broken symlinks:', broken.map(s => s.packagePath));
}
```

### 4. Switch Environment Files

```typescript
import {
  discoverPackages,
  removeSymlinks,
  createSymlinks
} from './env/index.js';

// Switch from .env.local to .env.production
const packages = await discoverPackages();

// Remove old symlinks
await removeSymlinks(packages);

// Create new symlinks
await createSymlinks(".env.production", packages);
```

## File Locations

All referenced paths are relative to the repository root:

- **platform schema**: `packages/platform/src/server.ts`
- **turbo.json**: `turbo.json`
- **Environment files**: `.env`, `.env.local`, `.env.production`, etc.
- **Packages**: `apps/*`, `packages/*`

## Error Handling

All functions throw descriptive errors when operations fail:

- File read/write errors include the original error message
- Schema parsing errors indicate what couldn't be found
- Symlink operations return success/failure per target

**Best Practice:** Always wrap calls in try-catch blocks:

```typescript
try {
  const result = await syncTurboEnv();
  console.log('Sync successful:', result);
} catch (error) {
  console.error('Sync failed:', error.message);
}
```

## TypeScript Support

All modules are fully typed with JSDoc comments. Import types as needed:

```typescript
import type {
  EnvVarDefinition,
  SyncResult,
  SymlinkResult,
  SymlinkStatus
} from './env/index.js';
```

## Testing

The modules use Node.js fs APIs and can be tested with:

1. **Unit tests**: Mock `fs` operations
2. **Integration tests**: Use temporary directories
3. **E2E tests**: Run against a test monorepo structure

Example test structure:
```
test/
  env/
    generator.test.ts
    platform.test.ts
    turbo-json.test.ts
    symlinks.test.ts
```

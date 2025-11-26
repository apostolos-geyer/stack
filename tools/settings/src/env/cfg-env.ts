/**
 * @fileoverview Configuration environment schema management
 * Functions for updating the platform Zod schema for server environment variables
 */

/**
 * Environment variable definition for schema generation
 */
export interface EnvVarDefinition {
  /** Variable name (e.g., "DATABASE_URL") */
  name: string;
  /** Zod type expression (e.g., "z.string().min(1)", "z.url()") */
  zodType: string;
  /** Whether the variable is optional */
  optional: boolean;
  /** Optional comment to add before the variable */
  comment?: string;
}

/**
 * All database-related env vars that may need to be removed when switching providers
 */
export const ALL_DB_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'TURSO_DB_NAME',
];

/**
 * Provider-specific env var requirements for platform schema
 */
export const PROVIDER_ENV_VARS: Record<string, EnvVarDefinition[]> = {
  sqlite: [
    { name: 'DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Database' },
  ],
  'prisma-postgres': [
    { name: 'DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Database' },
    { name: 'DIRECT_URL', zodType: 'z.string()', optional: false, comment: 'Direct connection for migrations' },
  ],
  postgres: [
    { name: 'DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Database' },
    { name: 'DIRECT_URL', zodType: 'z.string()', optional: false, comment: 'Direct connection for migrations' },
  ],
  turso: [
    { name: 'DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Database (local SQLite for migrations)' },
    { name: 'TURSO_DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Turso (runtime)' },
    { name: 'TURSO_AUTH_TOKEN', zodType: 'z.string()', optional: false },
    { name: 'TURSO_DB_NAME', zodType: 'z.string()', optional: false, comment: 'Turso database name (for CLI migrations)' },
  ],
  supabase: [
    { name: 'DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Database' },
    { name: 'DIRECT_URL', zodType: 'z.string()', optional: false, comment: 'Direct connection for migrations' },
  ],
  neon: [
    { name: 'DATABASE_URL', zodType: 'z.string()', optional: false, comment: 'Database' },
    { name: 'DIRECT_URL', zodType: 'z.string()', optional: false, comment: 'Direct connection for migrations' },
  ],
};

/**
 * Adds new environment variables to platform/src/server.ts schema
 * @description Inserts new variables into the server object of the Zod schema while maintaining formatting
 * @param currentContent - Current content of platform/src/server.ts
 * @param vars - Array of environment variable definitions to add
 * @returns Modified server.ts content with new variables added
 * @throws Error if the server object cannot be found in the content
 * @example
 * ```typescript
 * const updated = addEnvVarsToSchema(content, [{
 *   name: "API_KEY",
 *   zodType: "z.string()",
 *   optional: true,
 *   comment: "External API key"
 * }]);
 * ```
 */
export function addEnvVarsToSchema(
  currentContent: string,
  vars: EnvVarDefinition[]
): string {
  // Find the server object in the schema
  const serverMatch = currentContent.match(/server:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);

  if (!serverMatch) {
    throw new Error('Could not find server object in platform schema');
  }

  const serverContent = serverMatch[1];
  const lines = serverContent.split('\n');

  // Find the last variable definition (before the closing brace)
  let insertIndex = lines.length - 1;

  // Go backwards to find the last non-empty, non-comment line
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('//')) {
      insertIndex = i + 1;
      break;
    }
  }

  // Generate new variable definitions
  const newVarLines: string[] = [];

  for (const varDef of vars) {
    // Add blank line before new section
    if (newVarLines.length === 0 && insertIndex > 0) {
      newVarLines.push('');
    }

    // Add comment if provided
    if (varDef.comment) {
      newVarLines.push(`    // ${varDef.comment}`);
    }

    // Generate the variable definition
    const zodExpression = varDef.optional
      ? `${varDef.zodType}.optional()`
      : varDef.zodType;

    newVarLines.push(`    ${varDef.name}: ${zodExpression},`);
  }

  // Insert the new lines
  lines.splice(insertIndex, 0, ...newVarLines);

  // Reconstruct the content
  const newServerContent = lines.join('\n');
  const result = currentContent.replace(
    /server:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s,
    `server: {${newServerContent}}`
  );

  return result;
}

/**
 * Removes environment variables from platform/src/server.ts schema
 * @description Removes specified variables and their comments from the Zod schema
 * @param currentContent - Current content of platform/src/server.ts
 * @param vars - Array of variable names to remove
 * @returns Modified server.ts content with variables removed
 * @throws Error if the server object cannot be found in the content
 * @example
 * ```typescript
 * const updated = removeEnvVarsFromSchema(content, ["OLD_API_KEY", "DEPRECATED_VAR"]);
 * ```
 */
export function removeEnvVarsFromSchema(
  currentContent: string,
  vars: string[]
): string {
  const varSet = new Set(vars);
  let result = currentContent;

  for (const varName of vars) {
    // Match the variable definition and any preceding comment
    // This regex handles:
    // - Optional preceding comment line(s)
    // - The variable definition with any Zod chain
    // - The trailing comma and newline
    const varPattern = new RegExp(
      `(\\n\\s*//[^\\n]*\\n)?\\s*${varName}:\\s*z\\.[^,]+,?\\n`,
      'g'
    );

    result = result.replace(varPattern, '\n');
  }

  // Clean up any double blank lines that might have been created
  result = result.replace(/\n\n\n+/g, '\n\n');

  return result;
}

/**
 * Extracts all environment variable names from platform/src/server.ts
 * @description Parses the Zod schema to extract all defined variable names
 * @param content - Content of platform/src/server.ts
 * @returns Array of environment variable names defined in the schema
 * @throws Error if the server object cannot be found in the content
 * @example
 * ```typescript
 * const varNames = extractEnvVarNames(content);
 * // Returns: ["DATABASE_URL", "BETTER_AUTH_SECRET", "NODE_ENV", ...]
 * ```
 */
export function extractEnvVarNames(content: string): string[] {
  const serverMatch = content.match(/server:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);

  if (!serverMatch) {
    throw new Error('Could not find server object in platform schema');
  }

  const serverContent = serverMatch[1];
  const varNames: string[] = [];

  // Match all variable definitions (KEY: z.type()...)
  const varPattern = /^\s*([A-Z_][A-Z0-9_]*):\s*z\./gm;
  let match;

  while ((match = varPattern.exec(serverContent)) !== null) {
    varNames.push(match[1]);
  }

  return varNames.sort();
}

/**
 * Updates platform schema for a specific database provider
 * @description Removes all database-related env vars and adds provider-specific ones
 * @param content - Current content of platform/src/server.ts
 * @param providerId - Provider ID (sqlite, turso, supabase, neon, prisma-postgres)
 * @returns Modified server.ts content with updated env vars
 * @throws Error if provider is unknown or server object not found
 * @example
 * ```typescript
 * const updated = updateCfgEnvForProvider(content, 'supabase');
 * // Adds DATABASE_URL and DIRECT_URL, removes TURSO_* vars if present
 * ```
 */
export function updateCfgEnvForProvider(content: string, providerId: string): string {
  const providerVars = PROVIDER_ENV_VARS[providerId];
  if (!providerVars) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // First, remove all DB-related env vars
  let result = removeEnvVarsFromSchema(content, ALL_DB_ENV_VARS);

  // Then add the provider-specific vars
  result = addEnvVarsToSchema(result, providerVars);

  return result;
}

/**
 * Gets the provider-specific env var names
 * @param providerId - Provider ID
 * @returns Array of env var names for the provider
 */
export function getProviderEnvVarNames(providerId: string): string[] {
  const providerVars = PROVIDER_ENV_VARS[providerId];
  if (!providerVars) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return providerVars.map(v => v.name);
}

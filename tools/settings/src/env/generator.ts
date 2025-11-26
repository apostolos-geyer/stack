/**
 * @fileoverview Environment file generation utilities
 * Functions for generating, parsing, and merging .env file content
 */

/**
 * Generates .env file content from key-value pairs
 * @description Creates formatted .env file content with optional comments for each variable
 * @param vars - Object mapping environment variable names to their values
 * @param comments - Optional object mapping variable names to comment strings
 * @returns Formatted .env file content as a string
 * @example
 * ```typescript
 * const content = generateEnvContent(
 *   { DATABASE_URL: "postgresql://localhost:5432/db" },
 *   { DATABASE_URL: "PostgreSQL connection string" }
 * );
 * // Returns:
 * // # PostgreSQL connection string
 * // DATABASE_URL="postgresql://localhost:5432/db"
 * ```
 */
export function generateEnvContent(
  vars: Record<string, string>,
  comments?: Record<string, string>
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(vars)) {
    // Add comment if provided
    if (comments?.[key]) {
      lines.push(`# ${comments[key]}`);
    }

    // Quote values that contain spaces or special characters
    const needsQuotes = /[\s#]/.test(value);
    const formattedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;

    lines.push(`${key}=${formattedValue}`);
    lines.push(''); // Blank line after each variable
  }

  return lines.join('\n').trimEnd() + '\n';
}

/**
 * Parses existing .env file content into key-value pairs
 * @description Extracts environment variables from .env file content, ignoring comments and blank lines
 * @param content - Raw .env file content string
 * @returns Object mapping variable names to their values
 * @example
 * ```typescript
 * const vars = parseEnvContent(`
 *   # Database
 *   DATABASE_URL="postgresql://localhost:5432/db"
 *   NODE_ENV=development
 * `);
 * // Returns: { DATABASE_URL: "postgresql://localhost:5432/db", NODE_ENV: "development" }
 * ```
 */
export function parseEnvContent(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;

      // Remove surrounding quotes if present
      const unquotedValue = value.replace(/^["']|["']$/g, '');

      vars[key] = unquotedValue;
    }
  }

  return vars;
}

/**
 * Merges new environment variables into existing .env content
 * @description Updates or adds variables while preserving existing order, comments, and formatting
 * @param existingContent - Current .env file content
 * @param newVars - Object of variables to add or update
 * @returns Updated .env file content with merged variables
 * @example
 * ```typescript
 * const existing = `# Database\nDATABASE_URL="old-value"\n`;
 * const merged = mergeEnvContent(existing, {
 *   DATABASE_URL: "new-value",
 *   NEW_VAR: "value"
 * });
 * // Updates DATABASE_URL and appends NEW_VAR while preserving comments
 * ```
 */
export function mergeEnvContent(
  existingContent: string,
  newVars: Record<string, string>
): string {
  const lines = existingContent.split('\n');
  const result: string[] = [];
  const updatedKeys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a variable line
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);

    if (match) {
      const [, key] = match;

      if (key in newVars) {
        // Update existing variable
        const needsQuotes = /[\s#]/.test(newVars[key]);
        const formattedValue = needsQuotes
          ? `"${newVars[key].replace(/"/g, '\\"')}"`
          : newVars[key];

        result.push(`${key}=${formattedValue}`);
        updatedKeys.add(key);
      } else {
        // Keep existing variable
        result.push(line);
      }
    } else {
      // Keep comments, blank lines, etc.
      result.push(line);
    }
  }

  // Add new variables that weren't in the existing content
  const newKeys = Object.keys(newVars).filter(key => !updatedKeys.has(key));

  if (newKeys.length > 0) {
    // Add blank line before new variables if content doesn't end with one
    const lastLine = result[result.length - 1];
    if (lastLine && lastLine.trim() !== '') {
      result.push('');
    }

    for (const key of newKeys) {
      const needsQuotes = /[\s#]/.test(newVars[key]);
      const formattedValue = needsQuotes
        ? `"${newVars[key].replace(/"/g, '\\"')}"`
        : newVars[key];

      result.push(`${key}=${formattedValue}`);
    }
  }

  return result.join('\n');
}

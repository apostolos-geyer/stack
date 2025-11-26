/**
 * @fileoverview Turborepo globalEnv synchronization
 * Functions for managing the globalEnv array in turbo.json
 */

import fs from 'node:fs/promises';
import { PATHS } from '../utils/paths.ts';
import { extractEnvVarNames } from './cfg-env.ts';

/**
 * Result of syncing turbo.json globalEnv
 */
export interface SyncResult {
  /** Environment variables that were added to globalEnv */
  added: string[];
  /** Environment variables that were removed from globalEnv */
  removed: string[];
}

/**
 * Reads turbo.json and returns current globalEnv array
 * @description Parses turbo.json and extracts the globalEnv field
 * @returns Promise resolving to array of environment variable names in globalEnv
 * @throws Error if turbo.json cannot be read or parsed
 * @example
 * ```typescript
 * const envVars = await getGlobalEnv();
 * // Returns: ["DATABASE_URL", "NODE_ENV", ...]
 * ```
 */
export async function getGlobalEnv(): Promise<string[]> {
  try {
    const content = await fs.readFile(PATHS.TURBO_JSON, 'utf-8');
    const turboConfig = JSON.parse(content);

    if (!turboConfig.globalEnv || !Array.isArray(turboConfig.globalEnv)) {
      return [];
    }

    return turboConfig.globalEnv;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read turbo.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Updates turbo.json globalEnv to match cfg.env schema
 * @description Reads environment variables from cfg.env/src/server.ts and updates
 * turbo.json's globalEnv array to match, maintaining alphabetical order
 * @returns Promise resolving to sync result with added and removed variables
 * @throws Error if files cannot be read/written or parsed
 * @example
 * ```typescript
 * const result = await syncTurboEnv();
 * console.log(`Added: ${result.added.length}, Removed: ${result.removed.length}`);
 * ```
 */
export async function syncTurboEnv(): Promise<SyncResult> {
  try {
    // Read cfg.env schema to get the source of truth
    const cfgEnvContent = await fs.readFile(PATHS.CFG_ENV_SERVER, 'utf-8');
    const schemaVars = extractEnvVarNames(cfgEnvContent);

    // Read current turbo.json
    const turboContent = await fs.readFile(PATHS.TURBO_JSON, 'utf-8');
    const turboConfig = JSON.parse(turboContent);

    // Get current globalEnv
    const currentGlobalEnv = turboConfig.globalEnv || [];
    const currentSet = new Set(currentGlobalEnv);
    const schemaSet = new Set(schemaVars);

    // Calculate differences
    const added = schemaVars.filter(v => !currentSet.has(v));
    const removed = currentGlobalEnv.filter((v: string) => !schemaSet.has(v));

    // Update globalEnv with sorted schema vars
    turboConfig.globalEnv = schemaVars;

    // Write back to turbo.json with proper formatting
    const updatedContent = JSON.stringify(turboConfig, null, 2) + '\n';
    await fs.writeFile(PATHS.TURBO_JSON, updatedContent, 'utf-8');

    return { added, removed };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to sync turbo.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Sets globalEnv in turbo.json to a specific list of variables
 * @description Directly sets the globalEnv array, useful for custom configurations
 * @param vars - Array of environment variable names to set
 * @returns Promise that resolves when turbo.json is updated
 * @throws Error if turbo.json cannot be read/written or parsed
 * @example
 * ```typescript
 * await setGlobalEnv(["DATABASE_URL", "NODE_ENV", "API_KEY"]);
 * ```
 */
export async function setGlobalEnv(vars: string[]): Promise<void> {
  try {
    const content = await fs.readFile(PATHS.TURBO_JSON, 'utf-8');
    const turboConfig = JSON.parse(content);

    // Sort alphabetically
    turboConfig.globalEnv = [...vars].sort();

    // Write back with proper formatting
    const updatedContent = JSON.stringify(turboConfig, null, 2) + '\n';
    await fs.writeFile(PATHS.TURBO_JSON, updatedContent, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update turbo.json: ${error.message}`);
    }
    throw error;
  }
}

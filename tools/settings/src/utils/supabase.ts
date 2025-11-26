/**
 * @fileoverview Supabase local development automation
 * Handles initialization, starting, and status parsing for Supabase local stack
 */

import { exec, execStreaming } from "./exec.ts";
import { log } from "./logger.ts";
import { REPO_ROOT } from "./paths.ts";

/**
 * Parsed Supabase status output
 */
export interface SupabaseStatus {
  apiUrl: string;
  graphqlUrl: string;
  databaseUrl: string;
  studioUrl: string;
}

/**
 * Result from full Supabase setup
 */
export interface SupabaseSetupResult {
  databaseUrl: string;
  status: SupabaseStatus;
}

/**
 * Parses the output of `supabase status` to extract URLs
 *
 * @param output - Raw output from `supabase status` command
 * @returns Parsed status with extracted URLs
 * @throws Error if Database URL cannot be found
 *
 * @example
 * ```typescript
 * const status = parseSupabaseStatus(`
 *      API URL: http://127.0.0.1:54321
 *  Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
 * `)
 * // status.databaseUrl === 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
 * ```
 */
export function parseSupabaseStatus(output: string): SupabaseStatus {
  const patterns = {
    apiUrl: /API URL:\s+(.+)/,
    graphqlUrl: /GraphQL URL:\s+(.+)/,
    databaseUrl: /Database URL:\s+(.+)/,
    studioUrl: /Studio URL:\s+(.+)/,
  };

  const result: Partial<SupabaseStatus> = {};

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern);
    if (match?.[1]) {
      result[key as keyof SupabaseStatus] = match[1].trim();
    }
  }

  if (!result.databaseUrl) {
    throw new Error("Failed to parse Supabase status - Database URL not found");
  }

  // apiUrl and studioUrl are required for a healthy status
  if (!result.apiUrl || !result.studioUrl) {
    throw new Error("Failed to parse Supabase status - missing required URLs");
  }

  return result as SupabaseStatus;
}

/**
 * Checks if Supabase CLI is installed and available
 * @returns true if supabase command is available
 */
export async function isSupabaseCliAvailable(): Promise<boolean> {
  try {
    await exec("which supabase");
    return true;
  } catch {
    return false;
  }
}

/**
 * Initializes Supabase in the project directory
 * Uses --force to overwrite existing config, and disables IDE settings prompts
 *
 * @param cwd - Working directory (defaults to REPO_ROOT)
 */
export async function initSupabase(cwd: string = REPO_ROOT): Promise<void> {
  log.info("Initializing Supabase project...");

  const exitCode = await execStreaming(
    "supabase",
    [
      "init",
      "--force",
      "--with-intellij-settings=false",
      "--with-vscode-settings=false",
    ],
    cwd,
  );

  if (exitCode !== 0) {
    throw new Error(`Supabase init failed with exit code ${exitCode}`);
  }

  log.success("Supabase initialized");
}

/**
 * Starts the Supabase local development stack
 * This can take a while on first run as it pulls Docker images
 *
 * @param cwd - Working directory (defaults to REPO_ROOT)
 */
export async function startSupabase(cwd: string = REPO_ROOT): Promise<void> {
  log.info("Starting Supabase local stack (this may take a minute)...");

  const exitCode = await execStreaming("supabase", ["start"], cwd);

  if (exitCode !== 0) {
    throw new Error(`Supabase start failed with exit code ${exitCode}`);
  }

  log.success("Supabase started");
}

/**
 * Gets the current Supabase status and parses it
 *
 * @param cwd - Working directory (defaults to REPO_ROOT)
 * @returns Parsed Supabase status
 */
export async function getSupabaseStatus(
  cwd: string = REPO_ROOT,
): Promise<SupabaseStatus> {
  log.info("Getting Supabase status...");

  const result = await exec("supabase status", cwd);

  if (!result.stdout) {
    throw new Error("No output from supabase status command");
  }

  return parseSupabaseStatus(result.stdout);
}

/**
 * Stops the Supabase local development stack
 *
 * @param cwd - Working directory (defaults to REPO_ROOT)
 */
export async function stopSupabase(cwd: string = REPO_ROOT): Promise<void> {
  log.info("Stopping Supabase...");

  try {
    const exitCode = await execStreaming("supabase", ["stop"], cwd);
    if (exitCode === 0) {
      log.success("Supabase stopped");
    } else {
      log.warn(`Supabase stop exited with code ${exitCode}`);
    }
  } catch (error) {
    log.warn(
      `Failed to stop Supabase: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Full Supabase setup automation
 *
 * 1. Checks if Supabase CLI is installed
 * 2. Initializes Supabase (if not already initialized)
 * 3. Starts the local stack
 * 4. Parses status to get Database URL
 *
 * @param cwd - Working directory (defaults to REPO_ROOT)
 * @returns Setup result with database URL
 * @throws Error if CLI not installed or any step fails
 *
 * @example
 * ```typescript
 * const { databaseUrl } = await setupSupabase()
 * // databaseUrl === 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
 * ```
 */
export async function setupSupabase(
  cwd: string = REPO_ROOT,
): Promise<SupabaseSetupResult> {
  // Step 1: Check CLI is available
  const cliAvailable = await isSupabaseCliAvailable();
  if (!cliAvailable) {
    throw new Error(
      "Supabase CLI is not installed. Install with: npm install -g supabase",
    );
  }

  // Step 2: Initialize (will overwrite existing config)
  await initSupabase(cwd);

  // Step 3: Start the stack
  await startSupabase(cwd);

  // Step 4: Get status and extract Database URL
  const status = await getSupabaseStatus(cwd);

  log.success(`Database URL: ${status.databaseUrl}`);

  return {
    databaseUrl: status.databaseUrl,
    status,
  };
}

/**
 * @fileoverview Environment file symlink management
 * Functions for discovering and managing .env symlinks across the monorepo
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { REPO_ROOT } from '../utils/paths.ts';

/**
 * Result of a symlink creation operation
 */
export interface SymlinkResult {
  /** Target package path where symlink was created */
  target: string;
  /** Whether the symlink was successfully created */
  success: boolean;
  /** Error message if creation failed */
  error?: string;
}

/**
 * Status of a symlink in a package
 */
export interface SymlinkStatus {
  /** Package path relative to repo root */
  packagePath: string;
  /** Whether a .env file/symlink exists */
  exists: boolean;
  /** Whether the existing file is a symlink */
  isSymlink: boolean;
  /** Path the symlink points to (if it's a symlink) */
  target?: string;
  /** Whether the symlink points to the root .env file */
  isValid?: boolean;
}

/**
 * Discovers all .env.* files in repo root
 * @description Scans the repository root for environment files, excluding .env.example
 * @returns Promise resolving to array of env file names (e.g., [".env", ".env.local"])
 * @example
 * ```typescript
 * const envFiles = await discoverEnvFiles();
 * // Returns: [".env", ".env.local", ".env.production"]
 * ```
 */
export async function discoverEnvFiles(): Promise<string[]> {
  try {
    const pattern = '.env*';
    const files = await glob(pattern, {
      cwd: REPO_ROOT,
      absolute: false,
      dot: true,
      nodir: true,
    });

    // Filter out .env.example and sort
    return files
      .filter(file => file !== '.env.example' && !file.includes('.example'))
      .sort();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to discover env files: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Discovers all packages/apps in the monorepo
 * @description Scans workspace directories defined in pnpm-workspace.yaml
 * @returns Promise resolving to array of package paths relative to repo root
 * @example
 * ```typescript
 * const packages = await discoverPackages();
 * // Returns: ["apps/web", "apps/native", "packages/db", ...]
 * ```
 */
export async function discoverPackages(): Promise<string[]> {
  try {
    // Look in standard workspace directories
    const patterns = ['apps/*', 'packages/*'];
    const packages: string[] = [];

    for (const pattern of patterns) {
      const entries = await glob(pattern, {
        cwd: REPO_ROOT,
        absolute: false,
      });

      // Filter to directories and verify each has a package.json
      for (const entry of entries) {
        const fullPath = path.join(REPO_ROOT, entry);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          const pkgJsonPath = path.join(fullPath, 'package.json');
          try {
            await fs.access(pkgJsonPath);
            packages.push(entry);
          } catch {
            // Skip directories without package.json
          }
        }
      }
    }

    return packages.sort();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to discover packages: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Creates symlinks from packages to root .env file
 * @description Creates symbolic links in specified packages pointing to a root env file
 * @param sourceFile - Root .env file name (e.g., ".env.local", must exist in repo root)
 * @param targets - Array of package paths relative to repo root where symlinks should be created
 * @returns Promise resolving to array of SymlinkResult objects indicating success/failure for each target
 * @throws Error if the source file does not exist
 * @example
 * ```typescript
 * const results = await createSymlinks(".env.local", ["apps/web", "packages/db"]);
 * results.forEach(r => {
 *   console.log(`${r.target}: ${r.success ? "✓" : "✗ " + r.error}`);
 * });
 * ```
 */
export async function createSymlinks(
  sourceFile: string,
  targets: string[]
): Promise<SymlinkResult[]> {
  // Verify source file exists
  const sourcePath = path.join(REPO_ROOT, sourceFile);
  try {
    await fs.access(sourcePath);
  } catch {
    throw new Error(`Source file ${sourceFile} does not exist in repo root`);
  }

  const results: SymlinkResult[] = [];

  for (const target of targets) {
    const targetDir = path.join(REPO_ROOT, target);
    const symlinkPath = path.join(targetDir, '.env');

    try {
      // Check if target directory exists
      await fs.access(targetDir);

      // Remove existing file/symlink if it exists
      try {
        await fs.unlink(symlinkPath);
      } catch {
        // File doesn't exist, which is fine
      }

      // Calculate relative path from target to source
      const relativePath = path.relative(targetDir, sourcePath);

      // Create symlink
      await fs.symlink(relativePath, symlinkPath);

      results.push({
        target,
        success: true,
      });
    } catch (error) {
      results.push({
        target,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Gets current symlink status for all packages
 * @description Scans all packages in the monorepo and reports their .env symlink status
 * @returns Promise resolving to array of SymlinkStatus objects for each package
 * @example
 * ```typescript
 * const statuses = await getSymlinkStatus();
 * statuses.forEach(s => {
 *   console.log(`${s.packagePath}: ${s.isSymlink ? "linked" : "not linked"}`);
 * });
 * ```
 */
export async function getSymlinkStatus(): Promise<SymlinkStatus[]> {
  try {
    const packages = await discoverPackages();
    const statuses: SymlinkStatus[] = [];

    for (const pkg of packages) {
      const envPath = path.join(REPO_ROOT, pkg, '.env');

      try {
        const stats = await fs.lstat(envPath);
        const isSymlink = stats.isSymbolicLink();

        if (isSymlink) {
          const target = await fs.readlink(envPath);
          const resolvedTarget = path.resolve(path.dirname(envPath), target);
          const rootEnvPath = path.join(REPO_ROOT, '.env');

          statuses.push({
            packagePath: pkg,
            exists: true,
            isSymlink: true,
            target,
            isValid: resolvedTarget === rootEnvPath,
          });
        } else {
          statuses.push({
            packagePath: pkg,
            exists: true,
            isSymlink: false,
          });
        }
      } catch {
        // File doesn't exist
        statuses.push({
          packagePath: pkg,
          exists: false,
          isSymlink: false,
        });
      }
    }

    return statuses;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get symlink status: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Removes .env symlinks from specified packages
 * @description Deletes .env files/symlinks from the specified package directories
 * @param targets - Array of package paths where .env should be removed
 * @returns Promise resolving to array of SymlinkResult objects indicating success/failure
 * @example
 * ```typescript
 * const results = await removeSymlinks(["apps/web", "packages/db"]);
 * ```
 */
export async function removeSymlinks(targets: string[]): Promise<SymlinkResult[]> {
  const results: SymlinkResult[] = [];

  for (const target of targets) {
    const envPath = path.join(REPO_ROOT, target, '.env');

    try {
      await fs.unlink(envPath);
      results.push({
        target,
        success: true,
      });
    } catch (error) {
      // If file doesn't exist, consider it a success
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        results.push({
          target,
          success: true,
        });
      } else {
        results.push({
          target,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return results;
}

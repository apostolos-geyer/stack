import { simpleGit, type SimpleGit } from 'simple-git'
import { REPO_ROOT } from '../utils/paths.ts'
import { log } from '../utils/logger.ts'

export interface GitStatusResult {
  isGitRepo: boolean
  uncommittedFiles: string[]
  allCommitted: boolean
}

/**
 * Get all changed files from git status
 * @returns Set of repo-relative paths that have uncommitted changes
 */
async function getChangedFiles(): Promise<{ isGitRepo: boolean; changedFiles: Set<string> }> {
  const git: SimpleGit = simpleGit()

  const isRepo = await git.checkIsRepo()
  if (!isRepo) {
    return { isGitRepo: false, changedFiles: new Set() }
  }

  const status = await git.status()

  const changedFiles = new Set([
    ...status.modified,
    ...status.not_added,
    ...status.created,
    ...status.deleted,
    ...status.renamed.map((r) => r.to),
    ...status.conflicted,
  ])

  return { isGitRepo: true, changedFiles }
}

/**
 * Check git status for specified files
 * @param files - Array of file paths to check (absolute paths)
 * @returns GitStatusResult with repo status and uncommitted file list
 */
export async function checkGitStatus(
  files: string[]
): Promise<GitStatusResult> {
  try {
    const { isGitRepo, changedFiles } = await getChangedFiles()

    if (!isGitRepo) {
      log.warn('Not a git repository')
      return {
        isGitRepo: false,
        uncommittedFiles: [],
        allCommitted: false,
      }
    }

    // Check which of our target files have uncommitted changes
    const uncommittedFiles = files.filter((file) => {
      // Convert absolute path to repo-relative path
      const relativePath = file.startsWith(REPO_ROOT)
        ? file.slice(REPO_ROOT.length + 1)
        : file

      return changedFiles.has(relativePath)
    })

    return {
      isGitRepo: true,
      uncommittedFiles,
      allCommitted: uncommittedFiles.length === 0,
    }
  } catch (error) {
    log.error(
      `Failed to check git status: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    throw new Error(
      `Git status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check git status for specified directories (any file within)
 * @param directories - Array of directory paths to check (absolute paths)
 * @returns GitStatusResult with repo status and uncommitted file list
 */
export async function checkGitStatusForDirectories(
  directories: string[]
): Promise<GitStatusResult> {
  try {
    const { isGitRepo, changedFiles } = await getChangedFiles()

    if (!isGitRepo) {
      log.warn('Not a git repository')
      return {
        isGitRepo: false,
        uncommittedFiles: [],
        allCommitted: false,
      }
    }

    // Convert directories to repo-relative paths
    const relativeDirs = directories.map((dir) =>
      dir.startsWith(REPO_ROOT) ? dir.slice(REPO_ROOT.length + 1) : dir
    )

    // Check if any changed file is within our target directories
    const uncommittedFiles: string[] = []
    for (const changedFile of changedFiles) {
      for (const dir of relativeDirs) {
        if (changedFile.startsWith(dir + '/') || changedFile === dir) {
          uncommittedFiles.push(changedFile)
          break
        }
      }
    }

    return {
      isGitRepo: true,
      uncommittedFiles,
      allCommitted: uncommittedFiles.length === 0,
    }
  } catch (error) {
    log.error(
      `Failed to check git status: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    throw new Error(
      `Git status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Ensure all specified files are committed in git
 * @param files - Array of file paths to check
 * @throws Error if any files have uncommitted changes
 */
export async function ensureFilesCommitted(files: string[]): Promise<void> {
  const result = await checkGitStatus(files)

  if (!result.isGitRepo) {
    log.warn(
      'Not a git repository - skipping commit check (proceeding with caution)'
    )
    return
  }

  if (!result.allCommitted) {
    const fileList = result.uncommittedFiles.map((f) => `  - ${f}`).join('\n')
    const errorMsg = `The following files have uncommitted changes:\n${fileList}\n\nPlease commit these files before proceeding.`
    log.error(errorMsg)
    throw new Error(errorMsg)
  }

  log.success('All target files are committed')
}

/**
 * Ensure all files within specified directories are committed in git
 * @param directories - Array of directory paths to check
 * @throws Error if any files in those directories have uncommitted changes
 */
export async function ensureDirectoriesCommitted(directories: string[]): Promise<void> {
  const result = await checkGitStatusForDirectories(directories)

  if (!result.isGitRepo) {
    log.warn(
      'Not a git repository - skipping commit check (proceeding with caution)'
    )
    return
  }

  if (!result.allCommitted) {
    const fileList = result.uncommittedFiles.map((f) => `  - ${f}`).join('\n')
    const errorMsg = `The following files have uncommitted changes:\n${fileList}\n\nPlease commit all changes in the affected packages before proceeding.`
    log.error(errorMsg)
    throw new Error(errorMsg)
  }

  log.success('All files in protected packages are committed')
}

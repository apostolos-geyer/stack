import { createTwoFilesPatch } from 'diff'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

/**
 * Generate unified diff between old and new content
 * @param oldContent - Original file content
 * @param newContent - New file content
 * @param filePath - File path to show in diff header
 * @returns Unified diff string, or empty string if no changes
 */
export function generateDiff(
  oldContent: string,
  newContent: string,
  filePath: string
): string {
  // Return empty string if contents are identical
  if (oldContent === newContent) {
    return ''
  }

  // Create unified diff with file path context
  const diff = createTwoFilesPatch(
    filePath, // old file name
    filePath, // new file name
    oldContent,
    newContent,
    undefined, // old file header
    undefined, // new file header
    { context: 3 } // 3 lines of context
  )

  return diff
}

/**
 * Generate diff for a file by reading current content and comparing to new content
 * @param filePath - Absolute path to file
 * @param newContent - New content to compare against
 * @returns Unified diff string, or empty string if no changes
 */
export async function generateFileDiff(
  filePath: string,
  newContent: string
): Promise<string> {
  let oldContent = ''

  // Read existing file content if file exists
  if (existsSync(filePath)) {
    try {
      oldContent = await readFile(filePath, 'utf-8')
    } catch (error) {
      // If we can't read the file, treat it as empty
      oldContent = ''
    }
  }

  return generateDiff(oldContent, newContent, filePath)
}

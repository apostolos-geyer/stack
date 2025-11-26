import chalk from 'chalk'

/**
 * Display a colored diff in the terminal
 * @param diff - Unified diff string to display
 */
export function displayDiff(diff: string): void {
  if (!diff || diff.trim() === '') {
    return
  }

  const lines = diff.split('\n')

  for (const line of lines) {
    // File headers (---, +++, @@)
    if (line.startsWith('---') || line.startsWith('+++')) {
      console.log(chalk.cyan(line))
    }
    // Chunk headers (@@ -1,4 +1,5 @@)
    else if (line.startsWith('@@')) {
      console.log(chalk.cyan(line))
    }
    // Added lines
    else if (line.startsWith('+')) {
      console.log(chalk.green(line))
    }
    // Removed lines
    else if (line.startsWith('-')) {
      console.log(chalk.red(line))
    }
    // Context lines
    else {
      console.log(chalk.gray(line))
    }
  }
}

/**
 * Display multiple diffs with file separators
 * @param diffs - Array of file diffs to display
 */
export function displayMultipleDiffs(
  diffs: Array<{ filePath: string; diff: string }>
): void {
  if (diffs.length === 0) {
    return
  }

  for (let i = 0; i < diffs.length; i++) {
    const { filePath, diff } = diffs[i]

    // Skip empty diffs
    if (!diff || diff.trim() === '') {
      continue
    }

    // Show file header
    console.log()
    console.log(chalk.bold.underline(`File: ${filePath}`))
    console.log()

    // Display the diff
    displayDiff(diff)

    // Add separator between files (except after last file)
    if (i < diffs.length - 1) {
      console.log()
      console.log(chalk.gray('─'.repeat(80)))
    }
  }

  console.log()
}

// Git safety utilities
export {
  checkGitStatus,
  checkGitStatusForDirectories,
  ensureFilesCommitted,
  ensureDirectoriesCommitted,
  type GitStatusResult,
} from './git.ts'

// Backup and restore utilities
export {
  createBackup,
  restoreBackup,
  createBackups,
  restoreBackups,
  type Backup,
} from './backup.ts'

import { exec as execCallback, spawn, type ChildProcess } from 'node:child_process'
import { promisify } from 'node:util'
import { REPO_ROOT } from './paths.ts'
import path from 'node:path'

const execAsync = promisify(execCallback)

export interface ExecResult {
  stdout: string
  stderr: string
}

export async function exec(command: string, cwd = REPO_ROOT): Promise<ExecResult> {
  const result = await execAsync(command, { cwd })
  return {
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  }
}

export async function execStreaming(
  command: string,
  args: string[],
  cwd = REPO_ROOT
): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    })

    proc.on('close', (code) => {
      resolve(code ?? 0)
    })

    proc.on('error', reject)
  })
}

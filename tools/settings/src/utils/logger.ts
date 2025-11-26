import chalk from 'chalk'

export const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  error: (msg: string) => console.log(chalk.red('✗'), msg),
  step: (current: number, total: number, msg: string) =>
    console.log(chalk.cyan(`[${current}/${total}]`), msg),
  header: (msg: string) => {
    console.log()
    console.log(chalk.bold.underline(msg))
    console.log()
  },
  divider: () => console.log(chalk.gray('─'.repeat(50))),
  blank: () => console.log(),
}

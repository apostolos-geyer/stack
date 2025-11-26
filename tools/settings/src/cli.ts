/**
 * @fileoverview Main CLI orchestration for Settings tool
 * @description Handles argument parsing, command routing, and interactive menus.
 * Provides the main entry point for the CLI with support for:
 * - Interactive menu mode
 * - Direct command execution
 * - Help and version flags
 * - Graceful error handling and Ctrl+C handling
 */

import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbSwitch, envConfig, envLinks, HELP, showGeneralHelp } from './commands/index.ts';
import type { DbSwitchOptions, EnvConfigOptions, EnvLinksOptions } from './commands/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parsed command-line arguments
 */
interface ParsedArgs {
  /** Command to execute (e.g., 'db', 'db:switch', 'env', 'env:config') */
  command?: string;
  /** Show help message */
  help?: boolean;
  /** Show version number */
  version?: boolean;
  /** Additional options for commands */
  options: Record<string, string | boolean>;
}

/**
 * CLI argument parser
 * Parses process.argv into structured options
 *
 * Supported formats:
 * - Flags: --help, --version
 * - Options: --provider=neon, --provider neon
 * - Boolean flags: --skip-confirm, --non-interactive
 *
 * @param args - Command-line arguments (typically process.argv.slice(2))
 * @returns Parsed arguments structure
 *
 * @example
 * ```typescript
 * const args = parseArgs(['db:switch', '--provider', 'neon', '--skip-confirm']);
 * // {
 * //   command: 'db:switch',
 * //   options: {
 * //     provider: 'neon',
 * //     skipConfirm: true
 * //   }
 * // }
 * ```
 */
function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    options: {},
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg.startsWith('--')) {
      // Handle --key=value or --key value
      const [key, ...valueParts] = arg.slice(2).split('=');
      let value: string | boolean;

      if (valueParts.length > 0) {
        // --key=value format
        value = valueParts.join('=');
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        // --key value format
        value = args[++i];
      } else {
        // --key format (boolean flag)
        value = true;
      }

      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result.options[camelKey] = value;
    } else if (!result.command) {
      // First non-flag argument is the command
      result.command = arg;
    }
  }

  return result;
}

/**
 * Displays the main help text
 * Shows usage, commands, options, and examples
 */
function showHelp(): void {
  showGeneralHelp();
}

/**
 * Gets the version from package.json
 * @returns Version string
 */
function getVersion(): string {
  try {
    // Read from package.json in parent directory
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const content = require(packageJsonPath);
    return content.version || '0.0.1';
  } catch {
    return '0.0.1';
  }
}

/**
 * Displays the version number
 */
function showVersion(): void {
  console.log(getVersion());
}

/**
 * Shows interactive main menu when no command specified
 * Allows navigation through database and environment configuration options
 *
 * @returns Promise that resolves when menu selection is complete
 */
async function showMainMenu(): Promise<void> {
  console.log(chalk.bold('Settings CLI'));
  console.log(chalk.bold('============\n'));

  const choice = await select({
    message: 'What would you like to configure?',
    choices: [
      {
        name: 'Database Provider',
        value: 'db',
        description: 'Switch database provider (SQLite, Neon, Turso, etc.)',
      },
      {
        name: 'Environment Variables',
        value: 'env',
        description: 'Configure environment variables and Zod schemas',
      },
      {
        name: 'Environment Symlinks',
        value: 'env-links',
        description: 'Manage .env symlinks across packages',
      },
      {
        name: 'Exit',
        value: 'exit',
        description: 'Exit Settings CLI',
      },
    ],
  });

  switch (choice) {
    case 'db':
      await dbSwitch({});
      break;
    case 'env':
      await envConfig({});
      break;
    case 'env-links':
      await envLinks({});
      break;
    case 'exit':
      console.log('Goodbye!');
      break;
  }
}


/**
 * Main CLI entry point
 * Routes to appropriate command based on arguments or shows interactive menu
 *
 * @throws {Error} If command is invalid or execution fails
 *
 * @example
 * ```typescript
 * // Called from index.ts
 * await main();
 * ```
 */
export async function main(): Promise<void> {
  // Parse arguments
  const args = parseArgs(process.argv.slice(2));

  // Handle --help flag
  if (args.help) {
    if (args.command === 'db:switch') {
      console.log(HELP.DB_SWITCH);
    } else if (args.command === 'env:config') {
      console.log(HELP.ENV_CONFIG);
    } else if (args.command === 'env:links') {
      console.log(HELP.ENV_LINKS);
    } else {
      showHelp();
    }
    return;
  }

  // Handle --version flag
  if (args.version) {
    showVersion();
    return;
  }

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n' + chalk.yellow('Cancelled by user'));
    process.exit(0);
  });

  // Route to command or show menu
  switch (args.command) {
    case 'db':
    case 'db:switch':
      await dbSwitch(args.options as DbSwitchOptions);
      break;

    case 'env':
    case 'env:config':
      await envConfig(args.options as EnvConfigOptions);
      break;

    case 'env:links':
      await envLinks(args.options as EnvLinksOptions);
      break;

    case undefined:
      // No command - show interactive menu
      await showMainMenu();
      break;

    default:
      console.error(chalk.red(`Unknown command: ${args.command}`));
      console.log('Run ' + chalk.cyan('pnpm settings --help') + ' for usage information\n');
      process.exit(1);
  }
}

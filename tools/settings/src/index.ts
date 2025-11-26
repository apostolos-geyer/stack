#!/usr/bin/env -S node --experimental-strip-types --no-warnings
/**
 * @fileoverview Entry point for the Settings CLI
 * @description Provides a clean entry point with error handling and graceful exits.
 * Catches and formats errors before terminating the process.
 *
 * Usage:
 *   pnpm settings                 # Interactive menu
 *   pnpm settings --help          # Show help
 *   pnpm settings --version       # Show version
 *   pnpm settings db:switch       # Direct command
 */

import { main } from './cli.ts';
import chalk from 'chalk';

/**
 * Execute main CLI with error handling
 * Catches errors and displays them in a user-friendly format
 */
main().catch((error) => {
  // Format error message
  const message = error?.message || 'An unknown error occurred';

  // Display error
  console.error('\n' + chalk.bold.red('Error: ') + message + '\n');

  // Show stack trace in debug mode
  if (process.env.DEBUG) {
    console.error(chalk.gray('Stack trace:'));
    console.error(chalk.gray(error?.stack || 'No stack trace available'));
    console.error('');
  }

  // Exit with error code
  process.exit(1);
});

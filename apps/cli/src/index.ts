#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createNoteCommand } from './commands/note';
import { createDeckCommand } from './commands/deck';
import { createExportCommand } from './commands/export';
import { createBundleCommand } from './commands/bundle';
import { createStudyCommand } from './commands/study';
import { createConfigCommand } from './commands/config';
import { createStatusCommand } from './commands/status';
import { createSyncCommand } from './commands/sync';
import { createStatsCommand } from './commands/stats';
import { APP_CONFIG } from '@ankiniki/shared';

const program = new Command();

program
  .name('ankiniki')
  .description(APP_CONFIG.DESCRIPTION)
  .version(APP_CONFIG.VERSION);

// Note operations
program.addCommand(createNoteCommand());

// Deck operations
program.addCommand(createDeckCommand());

// Import/export
program.addCommand(createExportCommand());
program.addCommand(createBundleCommand());

// Utility
program.addCommand(createStudyCommand());
program.addCommand(createConfigCommand());
program.addCommand(createStatusCommand());
program.addCommand(createSyncCommand());
program.addCommand(createStatsCommand());

// Global error handling
process.on('unhandledRejection', error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

// Show help if no command provided
if (process.argv.length <= 2) {
  console.log(
    chalk.bold.blue(`🚀 ${APP_CONFIG.NAME} CLI v${APP_CONFIG.VERSION}`)
  );
  console.log(chalk.gray('Anki companion tool for engineers\n'));
  program.outputHelp();
  process.exit(0);
}

// Parse command line arguments
program.parse();

export default program;

#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createAddCommand } from './commands/add';
import { createListCommand } from './commands/list';
import { createConfigCommand } from './commands/config';
import { createStudyCommand } from './commands/study';
import { importCommand } from './commands/import';
import { createDeckCommand } from './commands/deck';
import { createDeleteCommand } from './commands/delete';
import { createExportCommand } from './commands/export';
import { createBundleCommand } from './commands/bundle';
import { createEditCommand } from './commands/edit';
import { createGenerateCommand } from './commands/generate';
import { createStatusCommand } from './commands/status';
import { createSyncCommand } from './commands/sync';
import { createStatsCommand } from './commands/stats';
import { createTagCommand } from './commands/tag';
import { APP_CONFIG } from '@ankiniki/shared';

const program = new Command();

program
  .name('ankiniki')
  .description(APP_CONFIG.DESCRIPTION)
  .version(APP_CONFIG.VERSION);

// Add subcommands
program.addCommand(createAddCommand());
program.addCommand(createListCommand());
program.addCommand(createStudyCommand());
program.addCommand(createConfigCommand());
program.addCommand(importCommand);
program.addCommand(createDeckCommand());
program.addCommand(createDeleteCommand());
program.addCommand(createExportCommand());
program.addCommand(createBundleCommand());
program.addCommand(createEditCommand());
program.addCommand(createGenerateCommand());
program.addCommand(createStatusCommand());
program.addCommand(createSyncCommand());
program.addCommand(createStatsCommand());
program.addCommand(createTagCommand());

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

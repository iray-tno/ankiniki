/**
 * Sync command - Trigger AnkiWeb sync from the terminal
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

export function createSyncCommand(): Command {
  const command = new Command('sync');

  command.description('Trigger AnkiWeb sync').action(async () => {
    const client = new AnkiClient();

    const connectSpinner = ora(ANKI_MESSAGES.CONNECTING).start();
    if (!(await client.ping())) {
      connectSpinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
      process.exit(1);
    }
    connectSpinner.succeed(ANKI_MESSAGES.CONNECTED);

    const syncSpinner = ora('Syncing with AnkiWeb…').start();
    try {
      await client.sync();
      syncSpinner.succeed(chalk.green('Sync complete'));
    } catch (error) {
      syncSpinner.fail(
        chalk.red(
          `Sync failed: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

  return command;
}

/**
 * Tag command - Bulk add/remove tags on notes matching a query
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

export function createTagCommand(): Command {
  const command = new Command('tag');

  command
    .description('Bulk add or remove tags on notes matching a query')
    .argument('<query>', 'AnkiConnect search query (e.g. "deck:Japanese")')
    .option('--add <tags>', 'Comma-separated tags to add')
    .option('--remove <tags>', 'Comma-separated tags to remove')
    .option('-d, --deck <name>', 'Scope search to a specific deck')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(
      async (
        query: string,
        options: {
          add?: string;
          remove?: string;
          deck?: string;
          yes?: boolean;
        }
      ) => {
        if (!options.add && !options.remove) {
          console.error(
            chalk.red('Provide at least one of --add or --remove.')
          );
          process.exit(1);
        }

        const tagsToAdd = options.add ? parseTags(options.add) : [];
        const tagsToRemove = options.remove ? parseTags(options.remove) : [];

        const client = new AnkiClient();

        const connSpinner = ora(ANKI_MESSAGES.CONNECTING).start();
        if (!(await client.ping())) {
          connSpinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          process.exit(1);
        }
        connSpinner.succeed(ANKI_MESSAGES.CONNECTED);

        // ── 1. Search ─────────────────────────────────────────────────────
        const fullQuery = options.deck
          ? `deck:"${options.deck}" ${query}`
          : query;

        const searchSpinner = ora('Searching…').start();
        let noteIds: number[];
        try {
          noteIds = await client.findNotes(fullQuery);
        } catch (error: any) {
          searchSpinner.fail(chalk.red(`Search failed: ${error.message}`));
          process.exit(1);
        }

        if (noteIds.length === 0) {
          searchSpinner.fail(chalk.yellow('No notes found for that query.'));
          process.exit(1);
        }

        searchSpinner.succeed(
          `Found ${chalk.white.bold(String(noteIds.length))} note${noteIds.length !== 1 ? 's' : ''}`
        );

        // ── 2. Preview ────────────────────────────────────────────────────
        console.log();
        if (tagsToAdd.length) {
          console.log(
            `  ${chalk.green('+')} Add:    ${tagsToAdd.map(t => chalk.green(t)).join('  ')}`
          );
        }
        if (tagsToRemove.length) {
          console.log(
            `  ${chalk.red('-')} Remove: ${tagsToRemove.map(t => chalk.red(t)).join('  ')}`
          );
        }
        console.log(
          `  ${chalk.gray('Affects')} ${chalk.white.bold(String(noteIds.length))} note${noteIds.length !== 1 ? 's' : ''}`
        );
        console.log();

        // ── 3. Confirm ────────────────────────────────────────────────────
        if (!options.yes) {
          const { default: inquirer } = await import('inquirer');
          const { ok } = await inquirer.prompt<{ ok: boolean }>([
            {
              type: 'confirm',
              name: 'ok',
              message: 'Apply these tag changes?',
              default: true,
            },
          ]);
          if (!ok) {
            console.log(chalk.yellow('Aborted.'));
            return;
          }
        }

        // ── 4. Apply ──────────────────────────────────────────────────────
        const applySpinner = ora('Applying tag changes…').start();
        try {
          // AnkiConnect expects tags as a space-separated string
          if (tagsToAdd.length) {
            await client.addTags(noteIds, tagsToAdd.join(' '));
          }
          if (tagsToRemove.length) {
            await client.removeTags(noteIds, tagsToRemove.join(' '));
          }
          applySpinner.succeed(
            chalk.green(
              `Updated tags on ${noteIds.length} note${noteIds.length !== 1 ? 's' : ''}`
            )
          );
        } catch (error: any) {
          applySpinner.fail(
            chalk.red(`Failed to update tags: ${error.message}`)
          );
          process.exit(1);
        }
      }
    );

  return command;
}

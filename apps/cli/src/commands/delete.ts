/**
 * Delete command - Remove a flashcard by note ID
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

export function createDeleteCommand(): Command {
  const command = new Command('delete');

  command
    .description('Delete a flashcard by note ID')
    .argument('<noteId>', 'Note ID to delete (shown in ankiniki list --cards)')
    .option('--force', 'Skip confirmation prompt')
    .action(async (noteIdStr: string, options: { force?: boolean }) => {
      const client = new AnkiClient();

      const noteId = parseInt(noteIdStr, 10);
      if (isNaN(noteId)) {
        console.error(chalk.red(`Invalid note ID: "${noteIdStr}"`));
        process.exit(1);
      }

      try {
        const spinner = ora(ANKI_MESSAGES.CONNECTING).start();
        if (!(await client.ping())) {
          spinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          process.exit(1);
        }
        spinner.succeed(ANKI_MESSAGES.CONNECTED);

        // Fetch note info to show front/back before confirming
        const notes = await client.notesInfo([noteId]);
        if (!notes || notes.length === 0) {
          console.error(chalk.red(`Note ID ${noteId} not found`));
          process.exit(1);
        }

        const note = notes[0];
        const fieldNames = Object.keys(note.fields);
        const front =
          fieldNames[0] && note.fields[fieldNames[0]]?.value
            ? note.fields[fieldNames[0]].value
                .replace(/<[^>]*>/g, '')
                .substring(0, 80)
            : '(no content)';

        console.log(chalk.bold('\n🗑  Card to delete:'));
        console.log(`   ID:    ${chalk.cyan(noteId)}`);
        console.log(
          `   Front: ${chalk.white(front)}${front.length >= 80 ? '...' : ''}`
        );
        if (note.tags?.length) {
          console.log(`   Tags:  ${chalk.gray(note.tags.join(', '))}`);
        }

        if (!options.force) {
          const { confirmed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmed',
              message: chalk.yellow('Delete this card? This cannot be undone.'),
              default: false,
            },
          ]);
          if (!confirmed) {
            console.log(chalk.gray('Cancelled'));
            return;
          }
        }

        const deleteSpinner = ora('Deleting card...').start();
        await client.deleteNotes([noteId]);
        deleteSpinner.succeed(`Card ${noteId} deleted`);
      } catch (error) {
        console.error(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });

  return command;
}

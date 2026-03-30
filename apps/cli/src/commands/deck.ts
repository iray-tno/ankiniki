/**
 * Deck command - Create, list, and delete Anki decks
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AnkiClient } from '../anki-client';

export function createDeckCommand(): Command {
  const command = new Command('deck');
  command.description('Manage Anki decks');

  // deck list
  command
    .command('list')
    .description('List all decks with card counts')
    .action(async () => {
      const client = new AnkiClient();
      try {
        const spinner = ora('Connecting to Anki...').start();
        if (!(await client.ping())) {
          spinner.fail('Cannot connect to Anki');
          process.exit(1);
        }
        spinner.succeed('Connected to Anki');

        const loadSpinner = ora('Loading decks...').start();
        const deckNames = await client.getDeckNames();
        loadSpinner.succeed(`Found ${deckNames.length} decks`);

        console.log(chalk.bold('\n📚 Available Decks:'));
        for (const [i, name] of deckNames.entries()) {
          const noteIds = await client.findNotes(`deck:"${name}"`);
          console.log(
            `${chalk.cyan(`${i + 1}.`)} ${chalk.white(name)} ${chalk.gray(`(${noteIds.length} cards)`)}`
          );
        }
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // deck create
  command
    .command('create <name>')
    .description('Create a new deck')
    .action(async (name: string) => {
      const client = new AnkiClient();
      try {
        const spinner = ora('Connecting to Anki...').start();
        if (!(await client.ping())) {
          spinner.fail('Cannot connect to Anki');
          process.exit(1);
        }
        spinner.succeed('Connected to Anki');

        const createSpinner = ora(`Creating deck "${name}"...`).start();
        await client.createDeck(name);
        createSpinner.succeed(`Deck "${name}" created`);
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // deck delete
  command
    .command('delete <name>')
    .description('Delete a deck and all its cards')
    .option('--force', 'Skip confirmation prompt')
    .action(async (name: string, options: { force?: boolean }) => {
      const client = new AnkiClient();
      try {
        const spinner = ora('Connecting to Anki...').start();
        if (!(await client.ping())) {
          spinner.fail('Cannot connect to Anki');
          process.exit(1);
        }
        spinner.succeed('Connected to Anki');

        // Verify deck exists
        const decks = await client.getDeckNames();
        if (!decks.includes(name)) {
          console.error(chalk.red(`Deck "${name}" not found`));
          process.exit(1);
        }

        // Get card count to show in warning
        const noteIds = await client.findNotes(`deck:"${name}"`);

        if (!options.force) {
          const { confirmed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmed',
              message: chalk.yellow(
                `Delete deck "${name}" and all ${noteIds.length} cards? This cannot be undone.`
              ),
              default: false,
            },
          ]);
          if (!confirmed) {
            console.log(chalk.gray('Cancelled'));
            return;
          }
        }

        const deleteSpinner = ora(`Deleting deck "${name}"...`).start();
        await client.deleteDeck(name);
        deleteSpinner.succeed(
          `Deck "${name}" deleted (${noteIds.length} cards removed)`
        );
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  return command;
}

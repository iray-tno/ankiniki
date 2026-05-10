import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';
import { loadConfig } from '../config';

export function createAddCommand(): Command {
  const command = new Command('add');

  command
    .description('Add a new flashcard')
    .argument('[deck]', 'Deck name')
    .argument('[front]', 'Front side of the card')
    .argument('[back]', 'Back side of the card')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .option('-m, --model <model>', 'Card model to use')
    .option('-i, --interactive', 'Interactive mode')
    .action(async (deck, front, back, options) => {
      const client = new AnkiClient();
      const config = loadConfig();

      try {
        // Check connection first
        const spinner = ora(ANKI_MESSAGES.CONNECTING).start();
        const isConnected = await client.ping();

        if (!isConnected) {
          spinner.fail(ANKI_MESSAGES.CANNOT_CONNECT_HINT);
          return;
        }
        spinner.succeed(ANKI_MESSAGES.CONNECTED);

        let cardData = {
          deck: deck || config.defaultDeck,
          front: front || '',
          back: back || '',
          tags: options.tags
            ? options.tags.split(',').map((t: string) => t.trim())
            : [],
          model: options.model || config.defaultModel,
        };

        // Interactive mode or missing arguments
        if (options.interactive || !cardData.front || !cardData.back) {
          const decks = await client.getDeckNames();
          const models = await client.modelNames();

          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'deck',
              message: 'Select deck:',
              choices: decks,
              default: cardData.deck,
              when: !deck,
            },
            {
              type: 'editor',
              name: 'front',
              message: 'Front side (question):',
              default: cardData.front,
              when: !cardData.front,
            },
            {
              type: 'editor',
              name: 'back',
              message: 'Back side (answer):',
              default: cardData.back,
              when: !cardData.back,
            },
            {
              type: 'list',
              name: 'model',
              message: 'Card model:',
              choices: models,
              default: cardData.model,
              when: !options.model,
            },
            {
              type: 'input',
              name: 'tags',
              message: 'Tags (comma-separated):',
              default: cardData.tags.join(', '),
              filter: (input: string) =>
                input
                  .split(',')
                  .map(t => t.trim())
                  .filter(t => t),
            },
          ]);

          cardData = { ...cardData, ...answers };
        }

        // Validate required fields
        if (!cardData.front.trim() || !cardData.back.trim()) {
          console.error(
            chalk.red('Error: Both front and back sides are required')
          );
          return;
        }

        // Get field names for the model
        const fieldNames = await client.modelFieldNames(cardData.model);

        // Map to AnkiConnect fields format
        const fields: Record<string, string> = {};
        if (fieldNames.length >= 2) {
          fields[fieldNames[0]] = cardData.front.replace(/\n/g, '<br>');
          fields[fieldNames[1]] = cardData.back.replace(/\n/g, '<br>');
        } else {
          fields.Front = cardData.front.replace(/\n/g, '<br>');
          fields.Back = cardData.back.replace(/\n/g, '<br>');
        }

        // Add the note
        const addSpinner = ora('Adding card...').start();
        const noteId = await client.addNote(
          cardData.deck,
          cardData.model,
          fields,
          cardData.tags
        );

        addSpinner.succeed(`Card added successfully! (ID: ${noteId})`);

        console.log(chalk.green('\n✓ Card Details:'));
        console.log(`  Deck: ${chalk.cyan(cardData.deck)}`);
        console.log(`  Model: ${chalk.cyan(cardData.model)}`);
        console.log(
          `  Tags: ${cardData.tags.length ? chalk.cyan(cardData.tags.join(', ')) : chalk.gray('None')}`
        );
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

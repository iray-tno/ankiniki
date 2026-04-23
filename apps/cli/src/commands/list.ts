import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

export function createListCommand(): Command {
  const command = new Command('list');

  command
    .description('List cards in a deck')
    .argument('<deck>', 'Deck name to list cards from')
    .option('-l, --limit <number>', 'Limit number of results', '10')
    .action(async (deck: string, options: { limit: string }) => {
      const client = new AnkiClient();

      try {
        const spinner = ora(ANKI_MESSAGES.CONNECTING).start();
        const isConnected = await client.ping();

        if (!isConnected) {
          spinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          return;
        }
        spinner.succeed(ANKI_MESSAGES.CONNECTED);

        await listCards(client, deck, parseInt(options.limit));
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  return command;
}

async function listCards(
  client: AnkiClient,
  deckName: string,
  limit: number
): Promise<void> {
  const spinner = ora(`Loading cards from "${deckName}"...`).start();

  try {
    const noteIds = await client.findNotes(`deck:"${deckName}"`);

    if (noteIds.length === 0) {
      spinner.succeed(`No cards found in deck "${deckName}"`);
      return;
    }

    const limitedIds = noteIds.slice(0, limit);
    const notesInfo = await client.notesInfo(limitedIds);

    spinner.succeed(
      `Found ${noteIds.length} cards (showing first ${limitedIds.length})`
    );

    console.log(chalk.bold(`\n🎯 Cards in "${deckName}":`));

    for (const [index, note] of notesInfo.entries()) {
      const fields = note.fields;
      const fieldNames = Object.keys(fields);

      console.log(chalk.cyan(`\n${index + 1}. Card ID: ${note.noteId}`));

      // Show first field as "front"
      if (fieldNames[0] && fields[fieldNames[0]].value) {
        console.log(
          `   ${chalk.yellow('Front:')} ${truncateText(fields[fieldNames[0]].value, 100)}`
        );
      }

      // Show second field as "back"
      if (fieldNames[1] && fields[fieldNames[1]].value) {
        console.log(
          `   ${chalk.yellow('Back:')} ${truncateText(fields[fieldNames[1]].value, 100)}`
        );
      }

      // Show tags if any
      if (note.tags && note.tags.length > 0) {
        console.log(
          `   ${chalk.yellow('Tags:')} ${chalk.gray(note.tags.join(', '))}`
        );
      }
    }

    if (noteIds.length > limit) {
      console.log(chalk.gray(`\n... and ${noteIds.length - limit} more cards`));
      console.log(chalk.gray(`Use --limit ${noteIds.length} to see all cards`));
    }
  } catch (error) {
    spinner.fail(`Failed to load cards from deck "${deckName}"`);
    throw error;
  }
}

function truncateText(text: string, maxLength: number): string {
  // Remove HTML tags and clean up text
  const cleaned = text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.substring(0, maxLength)}...`;
}

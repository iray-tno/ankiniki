import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { AnkiClient } from '../anki-client';

export function createListCommand(): Command {
  const command = new Command('list');
  
  command
    .description('List decks or cards')
    .option('-d, --decks', 'List all decks')
    .option('-c, --cards <deck>', 'List cards in a specific deck')
    .option('-l, --limit <number>', 'Limit number of results', '10')
    .action(async (options) => {
      const client = new AnkiClient();

      try {
        const spinner = ora('Connecting to Anki...').start();
        const isConnected = await client.ping();
        
        if (!isConnected) {
          spinner.fail('Cannot connect to Anki');
          return;
        }
        spinner.succeed('Connected to Anki');

        if (options.cards) {
          // List cards in specific deck
          await listCards(client, options.cards, parseInt(options.limit));
        } else {
          // List decks (default)
          await listDecks(client);
        }
        
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  return command;
}

async function listDecks(client: AnkiClient): Promise<void> {
  const spinner = ora('Loading decks...').start();
  
  try {
    const deckNames = await client.getDeckNames();
    spinner.succeed(`Found ${deckNames.length} decks`);
    
    console.log(chalk.bold('\n📚 Available Decks:'));
    
    for (const [index, deckName] of deckNames.entries()) {
      // Get card count for each deck
      const noteIds = await client.findNotes(`deck:"${deckName}"`);
      const cardCount = noteIds.length;
      
      console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.white(deckName)} ${chalk.gray(`(${cardCount} cards)`)}`);
    }
    
  } catch (error) {
    spinner.fail('Failed to load decks');
    throw error;
  }
}

async function listCards(client: AnkiClient, deckName: string, limit: number): Promise<void> {
  const spinner = ora(`Loading cards from "${deckName}"...`).start();
  
  try {
    const noteIds = await client.findNotes(`deck:"${deckName}"`);
    
    if (noteIds.length === 0) {
      spinner.succeed(`No cards found in deck "${deckName}"`);
      return;
    }
    
    const limitedIds = noteIds.slice(0, limit);
    const notesInfo = await client.notesInfo(limitedIds);
    
    spinner.succeed(`Found ${noteIds.length} cards (showing first ${limitedIds.length})`);
    
    console.log(chalk.bold(`\n🎯 Cards in "${deckName}":`));
    
    for (const [index, note] of notesInfo.entries()) {
      const fields = note.fields;
      const fieldNames = Object.keys(fields);
      
      console.log(chalk.cyan(`\n${index + 1}. Card ID: ${note.noteId}`));
      
      // Show first field as "front"
      if (fieldNames[0] && fields[fieldNames[0]].value) {
        console.log(`   ${chalk.yellow('Front:')} ${truncateText(fields[fieldNames[0]].value, 100)}`);
      }
      
      // Show second field as "back"  
      if (fieldNames[1] && fields[fieldNames[1]].value) {
        console.log(`   ${chalk.yellow('Back:')} ${truncateText(fields[fieldNames[1]].value, 100)}`);
      }
      
      // Show tags if any
      if (note.tags && note.tags.length > 0) {
        console.log(`   ${chalk.yellow('Tags:')} ${chalk.gray(note.tags.join(', '))}`);
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
  const cleaned = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength) + '...';
}
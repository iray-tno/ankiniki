import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { shuffleArray, ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

export function createStudyCommand(): Command {
  const command = new Command('study');

  command
    .description('Quick study session in the terminal')
    .argument('[deck]', 'Deck name to study')
    .option('-n, --count <number>', 'Number of cards to study', '5')
    .option('--random', 'Study cards in random order')
    .action(async (deck, options) => {
      const client = new AnkiClient();

      try {
        const spinner = ora(ANKI_MESSAGES.CONNECTING).start();
        const isConnected = await client.ping();

        if (!isConnected) {
          spinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          return;
        }
        spinner.succeed(ANKI_MESSAGES.CONNECTED);

        // Select deck if not provided
        let selectedDeck = deck;
        if (!selectedDeck) {
          const decks = await client.getDeckNames();
          const { deckChoice } = await inquirer.prompt([
            {
              type: 'list',
              name: 'deckChoice',
              message: 'Select deck to study:',
              choices: decks,
            },
          ]);
          selectedDeck = deckChoice;
        }

        // Get cards from deck
        const noteIds = await client.findNotes(`deck:"${selectedDeck}"`);

        if (noteIds.length === 0) {
          console.log(chalk.yellow(`No cards found in deck "${selectedDeck}"`));
          return;
        }

        // Limit and optionally shuffle
        let studyIds = noteIds.slice(0, parseInt(options.count));
        if (options.random) {
          studyIds = shuffleArray(studyIds);
        }

        const notesInfo = await client.notesInfo(studyIds);

        console.log(chalk.bold(`\n🎯 Starting study session: ${selectedDeck}`));
        console.log(chalk.gray(`${studyIds.length} cards to study\n`));

        let correct = 0;
        let total = 0;

        for (const [index, note] of notesInfo.entries()) {
          total++;
          console.log(
            chalk.cyan(`\n--- Card ${index + 1}/${notesInfo.length} ---`)
          );

          const fields = note.fields;
          const fieldNames = Object.keys(fields);

          // Show front (question)
          if (fieldNames[0] && fields[fieldNames[0]].value) {
            const front = cleanHtml(fields[fieldNames[0]].value);
            console.log(chalk.white('\n📝 Question:'));
            console.log(formatText(front));
          }

          // Wait for user to reveal answer
          await inquirer.prompt([
            {
              type: 'input',
              name: 'reveal',
              message: 'Press Enter to reveal answer...',
            },
          ]);

          // Show back (answer)
          if (fieldNames[1] && fields[fieldNames[1]].value) {
            const back = cleanHtml(fields[fieldNames[1]].value);
            console.log(chalk.green('\n💡 Answer:'));
            console.log(formatText(back));
          }

          // Get user rating
          const { rating } = await inquirer.prompt([
            {
              type: 'list',
              name: 'rating',
              message: 'How well did you know this?',
              choices: [
                { name: "❌ Again (didn't know)", value: 'again' },
                { name: '🔶 Hard (difficult)', value: 'hard' },
                { name: '✅ Good (knew it)', value: 'good' },
                { name: '🚀 Easy (too easy)', value: 'easy' },
              ],
            },
          ]);

          if (rating === 'good' || rating === 'easy') {
            correct++;
          }

          // Show tags if any
          if (note.tags && note.tags.length > 0) {
            console.log(chalk.gray(`Tags: ${note.tags.join(', ')}`));
          }
        }

        // Session summary
        const percentage = Math.round((correct / total) * 100);
        console.log(chalk.bold('\n🎉 Study Session Complete!'));
        console.log(
          `   Correct: ${chalk.green(correct)}/${total} (${percentage}%)`
        );

        if (percentage >= 80) {
          console.log(chalk.green('   Excellent work! 🌟'));
        } else if (percentage >= 60) {
          console.log(chalk.yellow('   Good progress! Keep it up! 👍'));
        } else {
          console.log(chalk.red('   Keep practicing! 💪'));
        }
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  return command;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&lt;/g, '<') // Replace HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function formatText(text: string): string {
  // Simple formatting for terminal
  const lines = text.split('\n');
  return lines.map(line => `   ${line}`).join('\n');
}

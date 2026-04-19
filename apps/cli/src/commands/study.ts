import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { shuffleArray, ANKI_MESSAGES, CardAnswer } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

const EASE_LABELS: Record<string, { label: string; ease: CardAnswer['ease'] }> =
  {
    again: { label: "❌ Again (didn't know)", ease: 1 },
    hard: { label: '🔶 Hard (struggled)', ease: 2 },
    good: { label: '✅ Good (knew it)', ease: 3 },
    easy: { label: '🚀 Easy (too easy)', ease: 4 },
  };

/** Remove HTML tags, entities, and [sound:...] references. */
function cleanField(html: string): string {
  return html
    .replace(/\[sound:[^\]]+\]/g, '') // strip sound tags
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function indent(text: string): string {
  return text
    .split('\n')
    .map(l => `   ${l}`)
    .join('\n');
}

export function createStudyCommand(): Command {
  const command = new Command('study');

  command
    .description('Study flashcards in the terminal')
    .argument('[deck]', 'Deck name to study')
    .option('-n, --count <number>', 'Max number of cards per session', '20')
    .option('--random', 'Study cards in random order')
    .option(
      '--due',
      'Study only cards currently due in Anki and report ratings back'
    )
    .action(async (deck: string | undefined, options) => {
      const client = new AnkiClient();

      try {
        const connSpinner = ora(ANKI_MESSAGES.CONNECTING).start();
        if (!(await client.ping())) {
          connSpinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          return;
        }
        connSpinner.succeed(ANKI_MESSAGES.CONNECTED);

        // ── Pick deck ─────────────────────────────────────────────────────
        let selectedDeck = deck;
        if (!selectedDeck) {
          const decks = await client.getDeckNames();
          const { deckChoice } = await inquirer.prompt<{ deckChoice: string }>([
            {
              type: 'list',
              name: 'deckChoice',
              message: 'Select deck to study:',
              choices: decks,
            },
          ]);
          selectedDeck = deckChoice;
        }

        const count = Math.max(1, parseInt(options.count, 10) || 20);
        const dueMode: boolean = options.due === true;

        // ── Fetch cards ───────────────────────────────────────────────────
        const fetchSpinner = ora('Fetching cards…').start();

        const query = dueMode
          ? `is:due deck:"${selectedDeck}"`
          : `deck:"${selectedDeck}"`;

        const cardIds = await client.findCards(query);

        if (cardIds.length === 0) {
          fetchSpinner.warn(
            dueMode
              ? `No due cards in "${selectedDeck}" — nothing to review today!`
              : `No cards found in "${selectedDeck}"`
          );
          return;
        }

        let sessionIds = cardIds.slice(0, count);
        if (options.random) {
          sessionIds = shuffleArray(sessionIds);
        }

        const cards = await client.cardsInfo(sessionIds);
        fetchSpinner.succeed(
          `${cards.length} card${cards.length !== 1 ? 's' : ''} loaded${
            dueMode ? chalk.gray(' (due)') : ''
          }`
        );

        // ── Session header ────────────────────────────────────────────────
        console.log(
          chalk.bold(`\n🎯 Study session: ${chalk.cyan(selectedDeck)}`)
        );
        if (dueMode) {
          console.log(
            chalk.gray(
              '   Ratings will be reported back to Anki for scheduling.\n'
            )
          );
        } else {
          console.log(
            chalk.gray(
              '   Browsing mode — ratings are for tracking only, not sent to Anki.\n'
            )
          );
        }

        // ── Study loop ────────────────────────────────────────────────────
        const tally = { again: 0, hard: 0, good: 0, easy: 0 };
        const pendingAnswers: CardAnswer[] = [];

        for (const [index, card] of cards.entries()) {
          console.log(
            chalk.cyan(`\n─── Card ${index + 1} / ${cards.length} ───`)
          );

          // Front: first field value
          const fieldNames = Object.keys(card.fields);
          const frontValue =
            fieldNames[0] !== undefined
              ? cleanField(card.fields[fieldNames[0]].value)
              : '(empty)';
          const backValue =
            fieldNames[1] !== undefined
              ? cleanField(card.fields[fieldNames[1]].value)
              : '(empty)';

          // Card type badge
          const typeBadge =
            card.type === 0
              ? chalk.blue('[new]')
              : card.type === 1 || card.type === 3
                ? chalk.yellow('[learning]')
                : chalk.green('[review]');
          const intervalStr =
            card.type === 2 && card.interval > 0
              ? chalk.gray(` · ${card.interval}d interval`)
              : '';
          console.log(`   ${typeBadge}${intervalStr}`);

          // Question
          console.log(chalk.white('\n📝 Question:'));
          console.log(indent(frontValue));

          // Reveal
          await inquirer.prompt([
            {
              type: 'input',
              name: 'reveal',
              message: 'Press Enter to reveal answer…',
            },
          ]);

          // Answer
          console.log(chalk.green('\n💡 Answer:'));
          console.log(indent(backValue));

          if (card.tags.length) {
            console.log(chalk.gray(`\n   Tags: ${card.tags.join(', ')}`));
          }

          // Rating
          const { rating } = await inquirer.prompt<{ rating: string }>([
            {
              type: 'list',
              name: 'rating',
              message: 'How well did you know this?',
              choices: Object.entries(EASE_LABELS).map(
                ([value, { label }]) => ({
                  name: label,
                  value,
                })
              ),
            },
          ]);

          tally[rating as keyof typeof tally]++;

          if (dueMode) {
            pendingAnswers.push({
              cardId: card.cardId,
              ease: EASE_LABELS[rating].ease,
            });
          }
        }

        // ── Submit ratings ────────────────────────────────────────────────
        if (dueMode && pendingAnswers.length > 0) {
          const submitSpinner = ora('Submitting ratings to Anki…').start();
          try {
            const results = await client.answerCards(pendingAnswers);
            const failed = results.filter(r => !r).length;
            if (failed > 0) {
              submitSpinner.warn(
                `Ratings submitted — ${failed} card(s) could not be answered (already answered?)`
              );
            } else {
              submitSpinner.succeed('Ratings submitted to Anki');
            }
          } catch (error) {
            submitSpinner.fail('Failed to submit ratings to Anki');
            console.error(
              chalk.red(error instanceof Error ? error.message : String(error))
            );
          }
        }

        // ── Session summary ───────────────────────────────────────────────
        const total = cards.length;
        const knownCount = tally.good + tally.easy;
        const pct = Math.round((knownCount / total) * 100);

        console.log(chalk.bold('\n🎉 Session complete!'));
        console.log(`   Cards studied: ${chalk.cyan(String(total))}`);
        console.log(
          `   ❌ Again: ${tally.again}  🔶 Hard: ${tally.hard}  ✅ Good: ${tally.good}  🚀 Easy: ${tally.easy}`
        );
        console.log(
          `   Score: ${pct >= 80 ? chalk.green(`${pct}%`) : pct >= 60 ? chalk.yellow(`${pct}%`) : chalk.red(`${pct}%`)}`
        );

        if (pct >= 80) {
          console.log(chalk.green('   Excellent work! 🌟'));
        } else if (pct >= 60) {
          console.log(chalk.yellow('   Good progress! Keep it up! 👍'));
        } else {
          console.log(chalk.red('   Keep practicing! 💪'));
        }
      } catch (error: unknown) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });

  return command;
}

/**
 * Stats command - Review statistics dashboard
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

export function createStatsCommand(): Command {
  const command = new Command('stats');

  command
    .description('Show review statistics')
    .option('--brief', 'One-line summary (useful in scripts or status bars)')
    .option('-d, --deck <name>', 'Scope to a specific deck')
    .action(async (options: { brief?: boolean; deck?: string }) => {
      const client = new AnkiClient();

      const spinner = ora(ANKI_MESSAGES.CONNECTING).start();
      if (!(await client.ping())) {
        spinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
        process.exit(1);
      }
      spinner.succeed(ANKI_MESSAGES.CONNECTED);

      const loadSpinner = ora('Loading stats…').start();

      try {
        // Get deck names (scoped or all)
        const allDecks = await client.getDeckNames();
        const decks = options.deck
          ? allDecks.filter(d => d === options.deck)
          : allDecks;

        if (options.deck && decks.length === 0) {
          loadSpinner.fail(chalk.red(`Deck "${options.deck}" not found`));
          process.exit(1);
        }

        // Run all queries in parallel
        const [deckStats, reviewedToday, addedThisWeek] = await Promise.all([
          client.getDeckStats(decks),
          client.findCards('rated:1'),
          client.findNotes('added:7'),
        ]);

        loadSpinner.stop();

        // Aggregate totals
        const statRows = Object.values(deckStats);
        const totalNew = statRows.reduce((s, d) => s + d.new_count, 0);
        const totalLearning = statRows.reduce((s, d) => s + d.learn_count, 0);
        const totalReview = statRows.reduce((s, d) => s + d.review_count, 0);
        const totalDue = totalNew + totalLearning + totalReview;

        if (options.brief) {
          const parts = [`${totalDue} due`];
          if (reviewedToday.length > 0) {
            parts.push(`${reviewedToday.length} reviewed today`);
          }
          if (addedThisWeek.length > 0) {
            parts.push(`${addedThisWeek.length} added this week`);
          }
          console.log(parts.join(' · '));
          return;
        }

        // Full dashboard
        console.log(chalk.bold('\n📊 Review Statistics\n'));

        // Due today — per deck
        console.log(chalk.bold('Due today'));
        const dueDeckRows = statRows
          .filter(d => d.new_count + d.learn_count + d.review_count > 0)
          .sort(
            (a, b) =>
              b.review_count + b.new_count - (a.review_count + a.new_count)
          );

        if (dueDeckRows.length === 0) {
          console.log(chalk.gray('  Nothing due — great job! 🎉'));
        } else {
          const maxNameLen = Math.max(...dueDeckRows.map(d => d.name.length));
          for (const d of dueDeckRows) {
            const due = d.new_count + d.learn_count + d.review_count;
            const name = d.name.padEnd(maxNameLen);
            const breakdown = [
              d.new_count > 0 ? chalk.blue(`${d.new_count} new`) : '',
              d.learn_count > 0 ? chalk.yellow(`${d.learn_count} learn`) : '',
              d.review_count > 0 ? chalk.green(`${d.review_count} review`) : '',
            ]
              .filter(Boolean)
              .join('  ');
            console.log(
              `  ${chalk.cyan(name)}  ${chalk.white.bold(String(due).padStart(4))} cards   ${breakdown}`
            );
          }
          const divider = '─'.repeat(36);
          console.log(`  ${chalk.gray(divider)}`);
          console.log(
            `  ${'Total'.padEnd(Math.max(...dueDeckRows.map(d => d.name.length)))}  ${chalk.white.bold(String(totalDue).padStart(4))} cards`
          );
        }

        // Activity
        console.log(chalk.bold('\nActivity'));
        console.log(
          `  ${chalk.gray('Reviewed today:  ')} ${chalk.white.bold(reviewedToday.length)} cards`
        );
        console.log(
          `  ${chalk.gray('Added this week:  ')} ${chalk.white.bold(addedThisWeek.length)} notes`
        );

        console.log();
      } catch (error) {
        loadSpinner.fail(
          chalk.red(
            `Failed to load stats: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });

  return command;
}

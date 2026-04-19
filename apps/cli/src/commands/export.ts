/**
 * Export command - Export a deck as an Anki package (.apkg)
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

export function createExportCommand(): Command {
  const command = new Command('export');

  command
    .description('Export a deck as an Anki package (.apkg)')
    .argument('<deck>', 'Deck name to export')
    .argument(
      '[output]',
      'Output file path (default: <deck>.apkg in current dir)'
    )
    .option('--include-sched', 'Include scheduling and review history data')
    .action(
      async (
        deck: string,
        output: string | undefined,
        options: { includeSched?: boolean }
      ) => {
        const client = new AnkiClient();

        try {
          const spinner = ora(ANKI_MESSAGES.CONNECTING).start();
          if (!(await client.ping())) {
            spinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
            process.exit(1);
          }
          spinner.succeed(ANKI_MESSAGES.CONNECTED);

          // Verify deck exists
          const decks = await client.getDeckNames();
          if (!decks.includes(deck)) {
            console.error(chalk.red(`Deck "${deck}" not found`));
            console.log(chalk.gray('Available decks:'));
            decks.forEach(d => console.log(chalk.gray(`  - ${d}`)));
            process.exit(1);
          }

          // Resolve output path
          const safeName = deck.replace(/[^a-zA-Z0-9_\-. ]/g, '_');
          const outputPath = output
            ? path.resolve(output)
            : path.resolve(process.cwd(), `${safeName}.apkg`);

          // Ensure parent directory exists
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            console.error(
              chalk.red(`Output directory does not exist: ${outputDir}`)
            );
            process.exit(1);
          }

          const exportSpinner = ora(`Exporting "${deck}"...`).start();
          const ok = await client.exportPackage(
            deck,
            outputPath,
            options.includeSched ?? false
          );

          if (!ok) {
            exportSpinner.fail('AnkiConnect failed to export the deck');
            process.exit(1);
          }

          if (!fs.existsSync(outputPath)) {
            exportSpinner.fail('Export file was not created');
            process.exit(1);
          }

          const size = fs.statSync(outputPath).size;
          const sizeStr =
            size >= 1024 * 1024
              ? `${(size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(size / 1024)} KB`;

          exportSpinner.succeed(
            `Exported "${deck}" → ${chalk.cyan(outputPath)} ${chalk.gray(`(${sizeStr})`)}`
          );

          if (options.includeSched) {
            console.log(chalk.gray('  Scheduling data included'));
          }
        } catch (error: any) {
          console.error(chalk.red(`Error: ${error.message}`));
          process.exit(1);
        }
      }
    );

  return command;
}

/**
 * Bundle command - Create a portable .apkg file from input data without Anki
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import AnkiExport from 'anki-apkg-export';
import {
  parseMarkdownCards,
  processJsonCards,
  processRows,
  validateCards,
  type ProcessedCard,
} from '@ankiniki/backend/src/lib/import-parsers';
import csv from 'csv-parser';
import { Readable } from 'stream';

export function createBundleCommand(): Command {
  const command = new Command('bundle');

  command
    .description(
      'Create a portable .apkg file from input data (JSON/CSV/Markdown)'
    )
    .argument('<file>', 'Input file path (.json, .csv, .md)')
    .argument('[output]', 'Output .apkg file path (default: <input-name>.apkg)')
    .option('-d, --deck <name>', 'Override default deck name')
    .option('-m, --model <name>', 'Default model name (default: Basic)')
    .option('-t, --tags <tags>', 'Comma-separated tags to add', val =>
      val.split(',')
    )
    .action(
      async (
        filePath: string,
        output: string | undefined,
        options: { deck?: string; model?: string; tags?: string[] }
      ) => {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) {
          console.error(chalk.red(`File not found: ${fullPath}`));
          process.exit(1);
        }

        const ext = path.extname(fullPath).toLowerCase();
        const baseName = path.basename(fullPath, ext);
        const outputPath = output
          ? path.resolve(output)
          : path.join(process.cwd(), `${baseName}.apkg`);

        const spinner = ora(`Bundling ${chalk.cyan(filePath)}...`).start();

        try {
          let processedCards: ProcessedCard[] = [];
          const content = fs.readFileSync(fullPath, 'utf-8');

          if (ext === '.json') {
            const jsonData = JSON.parse(content);
            processedCards = processJsonCards(jsonData, {
              defaultDeck: options.deck,
              defaultModel: options.model || 'Basic',
              defaultTags: options.tags || [],
            });
          } else if (ext === '.csv') {
            const rows: Record<string, string>[] = [];
            await new Promise<void>((resolve, reject) => {
              Readable.from([content])
                .pipe(csv())
                .on('data', (row: Record<string, string>) => rows.push(row))
                .on('end', () => resolve())
                .on('error', (err: Error) => reject(err));
            });
            processedCards = processRows(rows, {
              defaultDeck: options.deck,
              defaultModel: options.model || 'Basic',
              defaultTags: options.tags || [],
            });
          } else if (ext === '.md' || ext === '.markdown') {
            processedCards = parseMarkdownCards(content, {
              defaultDeck: options.deck,
              defaultModel: options.model || 'Basic',
              defaultTags: options.tags || [],
            });
          } else {
            spinner.fail(`Unsupported file extension: ${ext}`);
            process.exit(1);
          }

          const { valid: validCards, errors } = validateCards(processedCards);

          if (validCards.length === 0) {
            spinner.fail('No valid cards found to bundle');
            if (errors.length > 0) {
              console.error(chalk.yellow(`\nFound ${errors.length} errors:`));
              errors
                .slice(0, 5)
                .forEach(e =>
                  console.error(` - Card ${e.rowNumber}: ${e.error}`)
                );
            }
            process.exit(1);
          }

          // Create .apkg
          // anki-apkg-export creates one deck per file.
          // If we have multiple decks in input, we might need a more complex tool,
          // but for now we'll use the first card's deck or the override.
          const deckName =
            options.deck || validCards[0].deck || 'Ankiniki Bundle';
          const apkg = new (AnkiExport as any)(deckName);

          for (const card of validCards) {
            const tags = [...card.tags];
            if (options.tags) {
              tags.push(...options.tags);
            }

            apkg.addCard(card.front, card.back, { tags });
          }

          const zip = await apkg.save();
          fs.writeFileSync(outputPath, zip, 'binary');

          spinner.succeed(
            `Successfully bundled ${validCards.length} cards into ${chalk.cyan(outputPath)}`
          );
          if (errors.length > 0) {
            console.warn(
              chalk.yellow(`\n⚠️  Skipped ${errors.length} invalid cards.`)
            );
          }
        } catch (error: any) {
          spinner.fail(`Bundling failed: ${error.message}`);
          process.exit(1);
        }
      }
    );

  return command;
}

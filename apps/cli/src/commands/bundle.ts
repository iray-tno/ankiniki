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
} from '@ankiniki/shared';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Core bundling logic extracted for testability
 */
export async function bundleFile(
  filePath: string,
  output: string | undefined,
  options: { deck?: string; model?: string; tags?: string[] }
) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const ext = path.extname(fullPath).toLowerCase();
  const baseName = path.basename(fullPath, ext);
  const outputPath = output
    ? path.resolve(output)
    : path.join(process.cwd(), `${baseName}.apkg`);

  let processedCards: ProcessedCard[] = [];
  const content = fs.readFileSync(fullPath, 'utf-8');

  if (ext === '.json') {
    const jsonData = JSON.parse(content);
    processedCards = processJsonCards(jsonData, {
      defaultDeck: options.deck,
      defaultModel: options.model || 'Basic',
      defaultTags: options.tags || [],
      dryRun: false,
      validate: true,
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
      delimiter: ',',
      skipHeader: true,
      dryRun: false,
      columnMapping: {
        front: 'Front',
        back: 'Back',
        deck: 'Deck',
        tags: 'Tags',
        model: 'Model',
        difficulty: 'Difficulty',
      },
    });
  } else if (ext === '.md' || ext === '.markdown') {
    processedCards = parseMarkdownCards(content, {
      defaultDeck: options.deck,
      defaultModel: options.model || 'Basic',
      defaultTags: options.tags || [],
      dryRun: false,
    });
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  const { valid: validCards, errors } = validateCards(processedCards);

  if (validCards.length === 0) {
    let errorMsg = 'No valid cards found to bundle';
    if (errors.length > 0) {
      errorMsg += ` (${errors.length} errors found)`;
    }
    throw new Error(errorMsg);
  }

  // Create .apkg
  const deckName = options.deck || validCards[0].deck || 'Ankiniki Bundle';
  const apkg = new AnkiExport(deckName);

  for (const card of validCards) {
    const tags = [...card.tags];
    if (options.tags) {
      tags.push(...options.tags);
    }

    apkg.addCard(card.front, card.back, { tags });
  }

  const zip = await apkg.save();
  fs.writeFileSync(outputPath, zip, 'binary');

  return {
    cardCount: validCards.length,
    outputPath,
    errorCount: errors.length,
    errors,
  };
}

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
        const spinner = ora(`Bundling ${chalk.cyan(filePath)}...`).start();

        try {
          const result = await bundleFile(filePath, output, options);

          spinner.succeed(
            `Successfully bundled ${result.cardCount} cards into ${chalk.cyan(
              result.outputPath
            )}`
          );
          if (result.errorCount > 0) {
            console.warn(
              chalk.yellow(`\n⚠️  Skipped ${result.errorCount} invalid cards.`)
            );
            result.errors
              .slice(0, 5)
              .forEach(e =>
                console.error(` - Card ${e.rowNumber}: ${e.error}`)
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

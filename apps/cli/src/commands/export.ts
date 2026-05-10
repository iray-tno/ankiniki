/**
 * Export command - Export notes from Anki to .apkg, CSV, or JSON
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES, type NoteInfo } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

type Format = 'apkg' | 'csv' | 'json';

const DEFAULT_FORMAT: Format = 'apkg';

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function notesToCsv(notes: NoteInfo[]): string {
  if (notes.length === 0) {
    return '';
  }

  // Collect all unique field names (sorted by order from first note)
  const firstNote = notes[0];
  const fieldNames = Object.entries(firstNote.fields)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([name]) => name);

  const header = ['noteId', ...fieldNames, 'tags', 'modelName']
    .map(csvEscape)
    .join(',');

  const rows = notes.map(note => {
    const fieldValues = fieldNames.map(name =>
      csvEscape(note.fields[name]?.value ?? '')
    );
    return [
      String(note.noteId),
      ...fieldValues,
      csvEscape(note.tags.join(' ')),
      csvEscape(note.modelName),
    ].join(',');
  });

  return `${[header, ...rows].join('\n')}\n`;
}

function notesToJson(notes: NoteInfo[], deckName: string): string {
  const records = notes.map(note => {
    const fields: Record<string, string> = {};
    for (const [name, { value }] of Object.entries(note.fields)) {
      fields[name] = value;
    }
    return {
      noteId: note.noteId,
      deckName,
      modelName: note.modelName,
      tags: note.tags,
      fields,
    };
  });
  return `${JSON.stringify(records, null, 2)}\n`;
}

export function createExportCommand(): Command {
  const command = new Command('export');

  command
    .description('Export notes from Anki to .apkg, CSV, or JSON')
    .argument('<deck>', 'Deck name to export')
    .argument('[output]', 'Output file path (default: <deck>.<format>)')
    .option(
      '-f, --format <fmt>',
      'Output format: apkg | csv | json',
      DEFAULT_FORMAT
    )
    .option(
      '-q, --query <query>',
      'Extra query to filter notes (csv/json only, e.g. "tag:js")'
    )
    .option(
      '--include-sched',
      'Include scheduling/review history data (apkg only)'
    )
    .option(
      '--deck-name <name>',
      'Override the deckName written into JSON output (default: source deck name)'
    )
    .action(
      async (
        deck: string,
        output: string | undefined,
        options: {
          format: string;
          query?: string;
          includeSched?: boolean;
          deckName?: string;
        }
      ) => {
        const format = options.format as Format;
        if (!['apkg', 'csv', 'json'].includes(format)) {
          console.error(
            chalk.red(`Unknown format "${format}". Use apkg, csv, or json.`)
          );
          process.exit(1);
        }

        const client = new AnkiClient();

        const connSpinner = ora(ANKI_MESSAGES.CONNECTING).start();
        if (!(await client.ping())) {
          connSpinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          process.exit(1);
        }
        connSpinner.succeed(ANKI_MESSAGES.CONNECTED);

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
          : path.resolve(process.cwd(), `${safeName}.${format}`);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          console.error(
            chalk.red(`Output directory does not exist: ${outputDir}`)
          );
          process.exit(1);
        }

        // ── .apkg export (via AnkiConnect) ─────────────────────────────────
        if (format === 'apkg') {
          const exportSpinner = ora(`Exporting "${deck}"…`).start();
          try {
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
            exportSpinner.fail(chalk.red(`Export failed: ${error.message}`));
            process.exit(1);
          }
          return;
        }

        // ── CSV / JSON export (via findNotes + notesInfo) ──────────────────
        const baseQuery = `deck:"${deck}"`;
        const fullQuery = options.query
          ? `${baseQuery} ${options.query}`
          : baseQuery;

        const searchSpinner = ora('Fetching notes…').start();
        let noteIds: number[];
        try {
          noteIds = await client.findNotes(fullQuery);
        } catch (error: any) {
          searchSpinner.fail(chalk.red(`Search failed: ${error.message}`));
          process.exit(1);
        }

        if (noteIds.length === 0) {
          searchSpinner.fail(chalk.yellow('No notes found in that deck.'));
          process.exit(1);
        }

        let notes: NoteInfo[];
        try {
          notes = await client.notesInfo(noteIds);
          searchSpinner.succeed(
            `Fetched ${chalk.white.bold(String(notes.length))} note${notes.length !== 1 ? 's' : ''}`
          );
        } catch (error: any) {
          searchSpinner.fail(
            chalk.red(`Failed to fetch note details: ${error.message}`)
          );
          process.exit(1);
        }

        const writeSpinner = ora(`Writing ${format.toUpperCase()}…`).start();
        try {
          const content =
            format === 'csv'
              ? notesToCsv(notes)
              : notesToJson(notes, options.deckName ?? deck);
          fs.writeFileSync(outputPath, content, 'utf8');

          const size = fs.statSync(outputPath).size;
          const sizeStr =
            size >= 1024 ? `${Math.round(size / 1024)} KB` : `${size} B`;

          writeSpinner.succeed(
            `Exported ${notes.length} note${notes.length !== 1 ? 's' : ''} → ${chalk.cyan(outputPath)} ${chalk.gray(`(${sizeStr})`)}`
          );
        } catch (error: any) {
          writeSpinner.fail(
            chalk.red(`Failed to write file: ${error.message}`)
          );
          process.exit(1);
        }
      }
    );

  return command;
}

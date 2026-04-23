/**
 * Edit command - Edit an existing flashcard from the terminal
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ANKI_MESSAGES, type NoteInfo } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';

const DEFAULT_LIMIT = 20;

function clip(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/** Return fields sorted by order ascending */
function sortedFields(
  fields: NoteInfo['fields']
): Array<{ name: string; value: string }> {
  return Object.entries(fields)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([name, { value }]) => ({ name, value }));
}

export function createEditCommand(): Command {
  const command = new Command('edit');

  command
    .description('Search for a card and edit it in your $EDITOR')
    .argument(
      '<query>',
      'AnkiConnect search query (e.g. "TypeScript" or tag:js)'
    )
    .option('-d, --deck <name>', 'Scope search to a specific deck')
    .option(
      '-n, --limit <n>',
      `Max results to show in picker (default ${DEFAULT_LIMIT})`,
      String(DEFAULT_LIMIT)
    )
    .action(
      async (query: string, options: { deck?: string; limit: string }) => {
        const client = new AnkiClient();

        const connSpinner = ora(ANKI_MESSAGES.CONNECTING).start();
        if (!(await client.ping())) {
          connSpinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          process.exit(1);
        }
        connSpinner.succeed(ANKI_MESSAGES.CONNECTED);

        // ── 1. Search ───────────────────────────────────────────────────────
        const fullQuery = options.deck
          ? `deck:"${options.deck}" ${query}`
          : query;

        const searchSpinner = ora('Searching…').start();
        let noteIds: number[];
        try {
          noteIds = await client.findNotes(fullQuery);
        } catch (error: any) {
          searchSpinner.fail(chalk.red(`Search failed: ${error.message}`));
          process.exit(1);
        }

        if (noteIds.length === 0) {
          searchSpinner.fail(chalk.yellow('No notes found for that query.'));
          process.exit(1);
        }

        const limit = Math.max(1, parseInt(options.limit, 10) || DEFAULT_LIMIT);
        const sliced = noteIds.slice(0, limit);
        searchSpinner.succeed(
          `Found ${noteIds.length} note${noteIds.length !== 1 ? 's' : ''}${
            noteIds.length > limit ? ` — showing first ${limit}` : ''
          }`
        );

        // ── 2. Fetch note details ───────────────────────────────────────────
        const infoSpinner = ora('Loading notes…').start();
        let notes: NoteInfo[];
        try {
          notes = await client.notesInfo(sliced);
        } catch (error: any) {
          infoSpinner.fail(chalk.red(`Failed to load notes: ${error.message}`));
          process.exit(1);
        }
        infoSpinner.stop();

        // ── 3. Pick a note ──────────────────────────────────────────────────
        let selectedNote: NoteInfo;

        if (notes.length === 1) {
          selectedNote = notes[0];
          const fields = sortedFields(selectedNote.fields);
          console.log(
            chalk.gray(`\nFound 1 note: `) +
              chalk.cyan(
                clip(fields[0]?.value ?? String(selectedNote.noteId), 72)
              )
          );
        } else {
          const { noteId } = await inquirer.prompt<{ noteId: number }>([
            {
              type: 'list',
              name: 'noteId',
              message: 'Select a note to edit:',
              pageSize: 15,
              choices: notes.map(n => {
                const fields = sortedFields(n.fields);
                const front = fields[0]?.value ?? String(n.noteId);
                const back = fields[1]?.value ?? '';
                return {
                  name:
                    chalk.cyan(clip(front, 55)) +
                    chalk.gray('  →  ') +
                    chalk.gray(clip(back, 40)),
                  value: n.noteId,
                };
              }),
            },
          ]);
          selectedNote = notes.find(n => n.noteId === noteId)!;
        }

        // ── 4. Edit fields ──────────────────────────────────────────────────
        const fields = sortedFields(selectedNote.fields);
        console.log(
          chalk.bold(`\nEditing note `) +
            chalk.gray(String(selectedNote.noteId)) +
            chalk.bold(` (${selectedNote.modelName})`)
        );

        const edited: Record<string, string> = {};
        for (const field of fields) {
          const { value } = await inquirer.prompt<{ value: string }>([
            {
              type: 'editor',
              name: 'value',
              message: `${chalk.bold(field.name)}:`,
              default: field.value,
            },
          ]);
          edited[field.name] = value.trim();
        }

        // Confirm if nothing changed
        const changed = fields.filter(f => edited[f.name] !== f.value);
        if (changed.length === 0) {
          console.log(chalk.gray('\nNo changes made.'));
          return;
        }

        // ── 5. Save ─────────────────────────────────────────────────────────
        const saveSpinner = ora('Saving…').start();
        try {
          await client.updateNoteFields(selectedNote.noteId, edited);
          saveSpinner.succeed(
            chalk.green(
              `Note ${selectedNote.noteId} updated (${changed.length} field${changed.length !== 1 ? 's' : ''} changed)`
            )
          );
        } catch (error: any) {
          saveSpinner.fail(chalk.red(`Failed to save: ${error.message}`));
          process.exit(1);
        }
      }
    );

  return command;
}

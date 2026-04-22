/**
 * Generate command - AI-powered flashcard generation from local files
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import axios from 'axios';
import { ANKI_MESSAGES, ANKI_MODELS } from '@ankiniki/shared';
import { AnkiClient } from '../anki-client';
import { BackendManager } from '../backend-manager';
import { loadConfig } from '../config';

type ContentType = 'code' | 'markdown' | 'text';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface GenerateOptions {
  deck?: string;
  contentType?: string;
  difficulty: Difficulty;
  maxCards: string;
  lang?: string;
  tags?: string;
  yes?: boolean;
  stdin?: boolean;
}

interface GeneratedCard {
  front: string;
  back: string;
  tags: string[];
  difficulty: string;
  confidence_score: number;
}

const CODE_EXTENSIONS = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.h',
  '.go',
  '.rs',
  '.rb',
  '.php',
  '.swift',
  '.kt',
  '.scala',
  '.cs',
]);

function detectContentType(filePath: string): ContentType {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.md' || ext === '.markdown') {
    return 'markdown';
  }
  if (CODE_EXTENSIONS.has(ext)) {
    return 'code';
  }
  return 'text';
}

function detectContentTypeFromContent(content: string): ContentType {
  const trimmed = content.trimStart();
  if (trimmed.startsWith('#')) {
    return 'markdown';
  }
  if (
    /\bfunction\b|\bdef\b|\bclass\b|\bconst\b|\blet\b|\bvar\b|\bimport\b/.test(
      content
    )
  ) {
    return 'code';
  }
  return 'text';
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function clip(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

export function createGenerateCommand(): Command {
  const command = new Command('generate');

  command
    .description('Generate flashcards from a file using AI')
    .argument('[file]', 'File to generate cards from')
    .option('--stdin', 'Read content from stdin instead of a file')
    .option(
      '-d, --deck <deck>',
      'Deck to add cards to (uses config default if omitted)'
    )
    .option(
      '-t, --content-type <type>',
      'Content type: code | markdown | text (auto-detected from file extension)'
    )
    .option(
      '--difficulty <level>',
      'Difficulty: beginner | intermediate | advanced',
      'intermediate'
    )
    .option('-n, --max-cards <n>', 'Max cards to generate (1–20)', '5')
    .option('--lang <language>', 'Programming language hint (for code files)')
    .option('--tags <tags>', 'Additional tags to apply (comma-separated)')
    .option('-y, --yes', 'Add all generated cards without confirmation prompt')
    .action(async (file: string | undefined, options: GenerateOptions) => {
      const config = loadConfig();
      const deckName = options.deck || config.defaultDeck;
      const baseUrl = config.serverUrl;
      let cleanup: (() => void) | undefined;

      try {
        // ── 1. Validate input source ──────────────────────────────────────
        if (!file && !options.stdin) {
          console.error(
            chalk.red('Provide a file path or use --stdin to pipe content.')
          );
          process.exit(1);
        }
        if (file && options.stdin) {
          console.error(
            chalk.red('Cannot use both a file argument and --stdin.')
          );
          process.exit(1);
        }

        let content: string;
        let displaySource: string;
        let contentType: ContentType;

        if (options.stdin) {
          content = await readStdin();
          displaySource = '<stdin>';
          contentType =
            (options.contentType as ContentType | undefined) ??
            detectContentTypeFromContent(content);
        } else {
          const filePath = path.resolve(file!);
          if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`File not found: ${filePath}`));
            process.exit(1);
          }
          content = fs.readFileSync(filePath, 'utf8');
          displaySource = filePath;
          contentType =
            (options.contentType as ContentType | undefined) ??
            detectContentType(filePath);
        }

        if (!content.trim()) {
          console.error(chalk.red('Input is empty.'));
          process.exit(1);
        }

        const maxCards = Math.min(
          20,
          Math.max(1, parseInt(options.maxCards, 10) || 5)
        );
        const additionalTags = options.tags
          ? options.tags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [];

        console.log(
          chalk.bold('\n📄 File:         ') + chalk.cyan(displaySource)
        );
        console.log(chalk.bold('   Content type: ') + chalk.cyan(contentType));
        console.log(chalk.bold('   Deck:         ') + chalk.cyan(deckName));
        console.log(
          chalk.bold('   Max cards:    ') + chalk.cyan(String(maxCards))
        );
        console.log(
          chalk.bold('   Difficulty:   ') + chalk.cyan(options.difficulty)
        );
        console.log();

        // ── 2. Ensure backend is running ──────────────────────────────────
        cleanup = await BackendManager.ensure(baseUrl);

        // ── 3. Connect to Anki ────────────────────────────────────────────
        const ankiClient = new AnkiClient();
        const connSpinner = ora(ANKI_MESSAGES.CONNECTING).start();
        if (!(await ankiClient.ping())) {
          connSpinner.fail(ANKI_MESSAGES.CANNOT_CONNECT);
          process.exit(1);
        }
        connSpinner.succeed(ANKI_MESSAGES.CONNECTED);

        // ── 4. Ensure deck exists (offer to create) ───────────────────────
        const existingDecks = await ankiClient.getDeckNames();
        if (!existingDecks.includes(deckName)) {
          const { createDeck } = await inquirer.prompt<{
            createDeck: boolean;
          }>([
            {
              type: 'confirm',
              name: 'createDeck',
              message: `Deck "${deckName}" does not exist. Create it?`,
              default: true,
            },
          ]);
          if (!createDeck) {
            console.log(chalk.yellow('Aborted.'));
            return;
          }
          await ankiClient.createDeck(deckName);
          console.log(chalk.green(`✓ Created deck "${deckName}"`));
        }

        // ── 5. Generate cards ─────────────────────────────────────────────
        const genSpinner = ora('Generating cards with AI…').start();
        let cards: GeneratedCard[];

        try {
          const response = await axios.post<{
            success: boolean;
            data: { success: boolean; cards: GeneratedCard[] };
            detail?: string;
          }>(
            `${baseUrl}/api/ml/generate/cards`,
            {
              content,
              content_type: contentType,
              difficulty_level: options.difficulty,
              max_cards: maxCards,
              ...(options.lang ? { programming_language: options.lang } : {}),
              ...(additionalTags.length ? { tags: additionalTags } : {}),
            },
            { timeout: 60000 }
          );

          if (!response.data.success) {
            genSpinner.fail('AI generation failed');
            console.error(chalk.red(response.data.detail ?? 'Unknown error'));
            process.exit(1);
          }

          cards = response.data.data?.cards ?? [];
          genSpinner.succeed(
            `Generated ${chalk.green(String(cards.length))} card${cards.length !== 1 ? 's' : ''}`
          );
        } catch (error) {
          genSpinner.fail('Failed to generate cards');
          if (axios.isAxiosError(error)) {
            const msg =
              error.response?.data?.detail ??
              error.response?.data?.error ??
              error.message;
            console.error(chalk.red(msg));
          } else {
            console.error(
              chalk.red(error instanceof Error ? error.message : String(error))
            );
          }
          process.exit(1);
        }

        if (!cards.length) {
          console.log(chalk.yellow('No cards were generated.'));
          return;
        }

        // ── 6. Preview cards ──────────────────────────────────────────────
        console.log(chalk.bold('\n📋 Generated cards:\n'));
        cards.forEach((card, i) => {
          const conf = Math.round(card.confidence_score * 100);
          const confColor =
            conf >= 80 ? chalk.green : conf >= 60 ? chalk.yellow : chalk.red;

          console.log(
            `${chalk.cyan(`${i + 1}.`)} ${chalk.bold(clip(card.front, 80))}`
          );
          console.log(`   ${chalk.gray(clip(card.back, 100))}`);
          console.log(
            `   ${chalk.gray('Confidence:')} ${confColor(`${conf}%`)}` +
              `  ${chalk.gray('Difficulty:')} ${chalk.gray(card.difficulty)}`
          );
          if (card.tags.length) {
            console.log(`   ${chalk.gray(`Tags: ${card.tags.join(', ')}`)}`);
          }
          console.log();
        });

        // ── 7. Select cards ───────────────────────────────────────────────
        let selectedIndices: number[];

        if (options.yes) {
          selectedIndices = cards.map((_, i) => i);
          console.log(
            chalk.green(`Adding all ${cards.length} card(s) (--yes flag set)\n`)
          );
        } else {
          const { selected } = await inquirer.prompt<{ selected: number[] }>([
            {
              type: 'checkbox',
              name: 'selected',
              message:
                'Select cards to add to Anki (space to toggle, enter to confirm):',
              choices: cards.map((card, i) => ({
                name: clip(card.front, 72),
                value: i,
                checked: card.confidence_score >= 0.6,
              })),
            },
          ]);
          selectedIndices = selected;
        }

        if (!selectedIndices.length) {
          console.log(chalk.yellow('No cards selected. Nothing added.'));
          return;
        }

        // ── 8. Add selected cards to Anki ─────────────────────────────────
        const addSpinner = ora(
          `Adding ${selectedIndices.length} card(s) to Anki…`
        ).start();
        let successCount = 0;
        const failures: string[] = [];

        for (const idx of selectedIndices) {
          const card = cards[idx];
          const allTags = [
            ...card.tags,
            ...additionalTags,
            'ai-generated',
            `difficulty-${card.difficulty}`,
          ];
          if (options.lang) {
            allTags.push(options.lang);
          }

          try {
            await ankiClient.addNote(
              deckName,
              ANKI_MODELS.BASIC,
              { Front: card.front, Back: card.back },
              allTags
            );
            successCount++;
          } catch (error) {
            failures.push(
              `${clip(card.front, 50)}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        if (successCount > 0) {
          addSpinner.succeed(
            `Added ${chalk.green(String(successCount))} card(s) to deck "${deckName}"`
          );
        } else {
          addSpinner.fail('No cards were added successfully');
        }

        if (failures.length) {
          console.log(chalk.yellow(`\n${failures.length} card(s) failed:`));
          failures.forEach(f => console.log(chalk.red(`  ✗ ${f}`)));
        }

        if (successCount > 0) {
          console.log(chalk.green('\n🎉 Done!'));
        }
      } catch (error) {
        console.error(
          chalk.red('\nUnexpected error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      } finally {
        if (cleanup) {
          cleanup();
        }
      }
    });

  return command;
}

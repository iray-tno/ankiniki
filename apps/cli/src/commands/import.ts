/**
 * Import command - Bulk import flashcards from various formats
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { loadConfig } from '../config';
import { BackendManager } from '../backend-manager';
import { ANKI_MODELS } from '@ankiniki/shared';

type ImportFormat = 'csv' | 'json' | 'markdown';

interface ImportOptions {
  format?: ImportFormat;
  delimiter?: string;
  deck?: string;
  deckName?: string;
  model?: string;
  tags?: string;
  preview?: boolean;
  dryRun?: boolean;
  mapping?: string;
}

function detectFormat(filePath: string): ImportFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') {
    return 'json';
  }
  if (ext === '.md' || ext === '.markdown') {
    return 'markdown';
  }
  return 'csv';
}

export const importCommand = new Command('import')
  .description('Import flashcards from file (CSV, JSON, or Markdown)')
  .argument('<file>', 'Path to the import file')
  .option(
    '-f, --format <format>',
    'Import format: csv | json | markdown (auto-detected from extension)'
  )
  .option('-d, --delimiter <delimiter>', 'CSV delimiter', ',')
  .option('--deck <deck>', 'Default deck name')
  .option('--model <model>', 'Default card model', ANKI_MODELS.BASIC)
  .option('--tags <tags>', 'Default tags (comma-separated)')
  .option('-p, --preview', 'Preview import without creating cards')
  .option('--dry-run', "Dry run - validate but don't create cards")
  .option('--mapping <mapping>', 'Custom column mapping for CSV (JSON string)')
  .option(
    '--deck-name <deckName>',
    'Override deck for all cards — takes priority over deckName in the file'
  )
  .action(async (filePath: string, options: ImportOptions) => {
    const config = loadConfig();
    const baseUrl = config.serverUrl;
    let cleanup: (() => void) | undefined;

    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }

      // Ensure backend is running
      cleanup = await BackendManager.ensure(baseUrl);

      const absolutePath = path.resolve(filePath);
      const format: ImportFormat = options.format ?? detectFormat(absolutePath);

      console.log(`📁 Importing from: ${absolutePath}`);
      console.log(`📄 Format: ${format}`);

      if (format === 'csv') {
        await importCsv(absolutePath, options, baseUrl);
      } else if (format === 'json') {
        await importJson(absolutePath, options, baseUrl);
      } else if (format === 'markdown') {
        await importMarkdown(absolutePath, options, baseUrl);
      } else {
        console.error(`❌ Unsupported format: ${format}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(
        '❌ Import failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    } finally {
      if (cleanup) {
        cleanup();
      }
    }
  });

async function importCsv(
  filePath: string,
  options: ImportOptions,
  baseUrl: string
): Promise<void> {
  console.log(`📊 Importing CSV file...`);

  const csvOptions = {
    delimiter: options.delimiter || ',',
    defaultDeck: options.deck,
    defaultModel: options.model || ANKI_MODELS.BASIC,
    defaultTags: options.tags ? options.tags.split(',').map(t => t.trim()) : [],
    dryRun: options.preview || options.dryRun || false,
    columnMapping: {
      front: 'Front',
      back: 'Back',
      deck: 'Deck',
      tags: 'Tags',
      model: 'Model',
      difficulty: 'Difficulty',
    },
  };

  if (options.mapping) {
    try {
      const customMapping = JSON.parse(options.mapping);
      csvOptions.columnMapping = {
        ...csvOptions.columnMapping,
        ...customMapping,
      };
    } catch {
      console.error('❌ Invalid mapping JSON');
      process.exit(1);
    }
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('options', JSON.stringify(csvOptions));

  const endpoint = options.preview
    ? '/api/import/csv/preview'
    : '/api/import/csv';
  await postFormData(
    baseUrl,
    endpoint,
    formData,
    options.preview ?? false,
    displayPreview,
    displayImportResults
  );
}

async function importJson(
  filePath: string,
  options: ImportOptions,
  baseUrl: string
): Promise<void> {
  console.log(`📋 Importing JSON file...`);

  const jsonOptions = {
    defaultDeck: options.deck,
    defaultModel: options.model || ANKI_MODELS.BASIC,
    defaultTags: options.tags ? options.tags.split(',').map(t => t.trim()) : [],
    dryRun: options.preview || options.dryRun || false,
    validate: true,
    deckOverride: options.deckName,
  };

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('options', JSON.stringify(jsonOptions));

  const endpoint = options.preview
    ? '/api/import/json/preview'
    : '/api/import/json';
  await postFormData(
    baseUrl,
    endpoint,
    formData,
    options.preview ?? false,
    displayJsonPreview,
    displayJsonImportResults
  );
}

async function importMarkdown(
  filePath: string,
  options: ImportOptions,
  baseUrl: string
): Promise<void> {
  console.log(`📝 Importing Markdown file...`);

  const mdOptions = {
    defaultDeck: options.deck,
    defaultModel: options.model || ANKI_MODELS.BASIC,
    defaultTags: options.tags ? options.tags.split(',').map(t => t.trim()) : [],
    dryRun: options.preview || options.dryRun || false,
  };

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('options', JSON.stringify(mdOptions));

  const endpoint = options.preview
    ? '/api/import/markdown/preview'
    : '/api/import/markdown';
  await postFormData(
    baseUrl,
    endpoint,
    formData,
    options.preview ?? false,
    displayJsonPreview,
    displayJsonImportResults
  );
}

async function postFormData(
  baseUrl: string,
  endpoint: string,
  formData: FormData,
  isPreview: boolean,
  previewFn: (data: any) => void,
  resultFn: (data: any) => void
): Promise<void> {
  try {
    console.log(`🚀 ${isPreview ? 'Previewing' : 'Importing'}...`);

    const response = await axios.post(`${baseUrl}${endpoint}`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 60000,
    });

    const result = response.data;
    if (!result.success) {
      console.error('❌ Import failed:', result.error);
      process.exit(1);
    }

    if (isPreview || result.data.preview || result.data.dryRun) {
      previewFn(result.data);
    } else {
      resultFn(result.data);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        '❌ API Error:',
        error.response?.data?.error || error.message
      );
    } else {
      console.error('❌ Import error:', error);
    }
    process.exit(1);
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function displayPreview(data: any): void {
  console.log('\n📋 Import Preview:');
  console.log(`📁 Total rows: ${data.totalRows ?? data.totalCards}`);
  console.log(`✅ Valid cards: ${data.validCards}`);
  console.log(`❌ Invalid cards: ${data.invalidCards}`);

  if (data.detectedColumns) {
    console.log(`\n🔍 Detected columns: ${data.detectedColumns.join(', ')}`);
  }

  if (data.sampleCards?.length > 0) {
    console.log('\n📝 Sample cards:');
    data.sampleCards.slice(0, 3).forEach((card: any, i: number) => {
      console.log(
        `\n${i + 1}. Front: ${card.front.substring(0, 60)}${card.front.length > 60 ? '...' : ''}`
      );
      console.log(
        `   Back:  ${card.back.substring(0, 60)}${card.back.length > 60 ? '...' : ''}`
      );
      console.log(`   Deck:  ${card.deck}`);
      if (card.tags?.length) {
        console.log(`   Tags:  ${card.tags.join(', ')}`);
      }
    });
  }

  if (data.errors?.length > 0) {
    console.log('\n❌ Validation errors:');
    data.errors
      .slice(0, 3)
      .forEach((e: any) => console.log(`   Row ${e.rowNumber}: ${e.error}`));
  }

  console.log('\n💡 Remove --preview to proceed with import');
}

function displayJsonPreview(data: any): void {
  console.log('\n📋 Import Preview:');
  console.log(`📁 Total cards: ${data.totalCards}`);
  console.log(`✅ Valid cards: ${data.validCards}`);
  console.log(`❌ Invalid cards: ${data.invalidCards}`);

  if (data.sampleCards?.length > 0) {
    console.log('\n📝 Sample cards:');
    data.sampleCards.slice(0, 3).forEach((card: any, i: number) => {
      console.log(
        `\n${i + 1}. Front: ${card.front.substring(0, 60)}${card.front.length > 60 ? '...' : ''}`
      );
      console.log(
        `   Back:  ${card.back.substring(0, 60)}${card.back.length > 60 ? '...' : ''}`
      );
      console.log(`   Deck:  ${card.deck}`);
      if (card.tags?.length) {
        console.log(`   Tags:  ${card.tags.join(', ')}`);
      }
    });
  }

  if (data.errors?.length > 0) {
    console.log('\n❌ Validation errors:');
    data.errors
      .slice(0, 3)
      .forEach((e: any) => console.log(`   Card ${e.rowNumber}: ${e.error}`));
  }

  console.log('\n💡 Remove --preview to proceed with import');
}

function displayImportResults(data: any): void {
  console.log('\n✅ Import Complete!');
  console.log(`📊 Total processed: ${data.totalRows ?? data.totalCards}`);
  console.log(`✅ Imported: ${data.successfulCards}`);
  console.log(`❌ Failed:   ${data.failedCards}`);

  const failures = data.results?.filter((r: any) => !r.success) ?? [];
  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    failures
      .slice(0, 5)
      .forEach((f: any) => console.log(`   Row ${f.rowNumber}: ${f.error}`));
    if (failures.length > 5) {
      console.log(`   ... and ${failures.length - 5} more`);
    }
  }

  console.log('\n🎉 Done!');
}

function displayJsonImportResults(data: any): void {
  console.log('\n✅ Import Complete!');
  console.log(`📊 Total processed: ${data.totalCards}`);
  console.log(`✅ Imported: ${data.successfulCards}`);
  console.log(`❌ Failed:   ${data.failedCards}`);

  const failures = data.results?.filter((r: any) => !r.success) ?? [];
  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    failures
      .slice(0, 5)
      .forEach((f: any) => console.log(`   Card ${f.rowNumber}: ${f.error}`));
    if (failures.length > 5) {
      console.log(`   ... and ${failures.length - 5} more`);
    }
  }

  console.log('\n🎉 Done!');
}

// ─── Mapping subcommand ───────────────────────────────────────────────────────

export const mappingCommand = new Command('mapping')
  .description('Show import format examples')
  .action(() => {
    console.log('📊 Import Format Examples:\n');

    console.log('CSV (standard):');
    console.log('  Front,Back,Deck,Tags,Model');
    console.log('  "What is React?","JS library","React","react","Basic"\n');

    console.log('CSV (custom mapping):');
    console.log('  Question,Answer,Subject');
    console.log(
      '  CLI: --mapping \'{"front":"Question","back":"Answer","deck":"Subject"}\'\n'
    );

    console.log('JSON:');
    console.log(
      '  [{"front":"What is a closure?","back":"...","deck":"JS","tags":["js"]}]\n'
    );

    console.log('Markdown (cards.md):');
    console.log('  ---');
    console.log('  deck: Programming::JavaScript');
    console.log('  tags: [javascript, closures]');
    console.log('  ---');
    console.log('');
    console.log('  ## Card 1');
    console.log('  **Front:** What is a closure?');
    console.log('  **Back:** A function that captures its enclosing scope.\n');

    console.log(
      '  CLI: ankiniki import cards.md  (format auto-detected from .md extension)'
    );
  });

importCommand.addCommand(mappingCommand);

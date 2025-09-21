/**
 * Import command - Bulk import flashcards from various formats
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { readConfig } from '../config';

interface ImportOptions {
  format: 'csv' | 'json';
  delimiter?: string;
  deck?: string;
  model?: string;
  tags?: string;
  preview?: boolean;
  dryRun?: boolean;
  mapping?: string;
}

interface CsvImportOptions {
  delimiter: string;
  defaultDeck?: string;
  defaultModel: string;
  defaultTags: string[];
  dryRun: boolean;
  columnMapping: {
    front: string;
    back: string;
    deck?: string;
    tags?: string;
    model?: string;
    difficulty?: string;
  };
}

export const importCommand = new Command('import')
  .description('Import flashcards from file')
  .argument('<file>', 'Path to the import file')
  .option('-f, --format <format>', 'Import format (csv, json)', 'csv')
  .option('-d, --delimiter <delimiter>', 'CSV delimiter', ',')
  .option('--deck <deck>', 'Default deck name')
  .option('--model <model>', 'Default card model', 'Basic')
  .option('--tags <tags>', 'Default tags (comma-separated)')
  .option('-p, --preview', 'Preview import without creating cards')
  .option('--dry-run', "Dry run - validate but don't create cards")
  .option('--mapping <mapping>', 'Custom column mapping (JSON string)')
  .action(async (filePath: string, options: ImportOptions) => {
    try {
      const config = readConfig();

      // Validate file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }

      const absolutePath = path.resolve(filePath);
      console.log(`📁 Importing from: ${absolutePath}`);

      if (options.format === 'csv') {
        await importCsv(
          absolutePath,
          options,
          config.ankiConnectUrl || 'http://localhost:3001'
        );
      } else if (options.format === 'json') {
        await importJson(
          absolutePath,
          options,
          config.ankiConnectUrl || 'http://localhost:3001'
        );
      } else {
        console.error(`❌ Unsupported format: ${options.format}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(
        '❌ Import failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  });

async function importCsv(
  filePath: string,
  options: ImportOptions,
  baseUrl: string
): Promise<void> {
  console.log(`📊 Importing CSV file...`);

  // Prepare import options
  const csvOptions: CsvImportOptions = {
    delimiter: options.delimiter || ',',
    defaultDeck: options.deck,
    defaultModel: options.model || 'Basic',
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

  // Apply custom column mapping if provided
  if (options.mapping) {
    try {
      const customMapping = JSON.parse(options.mapping);
      csvOptions.columnMapping = {
        ...csvOptions.columnMapping,
        ...customMapping,
      };
    } catch (error) {
      console.error('❌ Invalid mapping JSON:', error);
      process.exit(1);
    }
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('options', JSON.stringify(csvOptions));

  // Choose endpoint based on preview mode
  const endpoint = options.preview
    ? '/api/import/csv/preview'
    : '/api/import/csv';

  try {
    console.log(`🚀 ${options.preview ? 'Previewing' : 'Importing'} CSV...`);

    const response = await axios.post(`${baseUrl}${endpoint}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 second timeout for large files
    });

    const result = response.data;

    if (!result.success) {
      console.error('❌ Import failed:', result.error);
      process.exit(1);
    }

    // Display results
    if (options.preview || result.data.preview) {
      displayPreview(result.data);
    } else {
      displayImportResults(result.data);
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

async function importJson(
  _filePath: string,
  _options: ImportOptions,
  _baseUrl: string
): Promise<void> {
  console.log(`📋 JSON import not yet implemented`);
  console.log(`💡 Use CSV format or the API directly for now`);
  process.exit(1);
}

interface PreviewData {
  totalRows: number;
  validCards: number;
  invalidCards: number;
  detectedColumns?: string[];
  sampleCards?: Array<{
    front: string;
    back: string;
    deck: string;
    tags: string[];
  }>;
  errors?: Array<{
    rowNumber: number;
    error: string;
  }>;
}

function displayPreview(data: PreviewData): void {
  console.log('\n📋 Import Preview:');
  console.log(`📁 Total rows: ${data.totalRows}`);
  console.log(`✅ Valid cards: ${data.validCards}`);
  console.log(`❌ Invalid cards: ${data.invalidCards}`);

  if (data.detectedColumns) {
    console.log(`\n🔍 Detected columns: ${data.detectedColumns.join(', ')}`);
  }

  if (data.sampleCards && data.sampleCards.length > 0) {
    console.log('\n📝 Sample cards:');
    data.sampleCards.slice(0, 3).forEach((card, index: number) => {
      console.log(
        `\n${index + 1}. Front: ${card.front.substring(0, 60)}${card.front.length > 60 ? '...' : ''}`
      );
      console.log(
        `   Back: ${card.back.substring(0, 60)}${card.back.length > 60 ? '...' : ''}`
      );
      console.log(`   Deck: ${card.deck}`);
      console.log(`   Tags: ${card.tags.join(', ')}`);
    });
  }

  if (data.errors && data.errors.length > 0) {
    console.log('\n❌ Sample errors:');
    data.errors.slice(0, 3).forEach(error => {
      console.log(`   Row ${error.rowNumber}: ${error.error}`);
    });
  }

  console.log('\n💡 To proceed with import, remove the --preview flag');
}

interface ImportResults {
  totalRows: number;
  successfulCards: number;
  failedCards: number;
  summary?: {
    imported: number;
    failed: number;
    invalid: number;
  };
  results?: Array<{
    rowNumber: number;
    success: boolean;
    error?: string;
  }>;
}

function displayImportResults(data: ImportResults): void {
  console.log('\n✅ Import Complete!');
  console.log(`📊 Total rows processed: ${data.totalRows}`);
  console.log(`✅ Successfully imported: ${data.successfulCards} cards`);
  console.log(`❌ Failed to import: ${data.failedCards} cards`);

  if (data.summary) {
    console.log('\n📈 Summary:');
    console.log(`   ✅ Imported: ${data.summary.imported}`);
    console.log(`   ❌ Failed: ${data.summary.failed}`);
    console.log(`   ⚠️  Invalid: ${data.summary.invalid}`);
  }

  // Show sample failures if any
  if (data.results) {
    const failures = data.results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('\n❌ Sample failures:');
      failures.slice(0, 5).forEach(failure => {
        console.log(`   Row ${failure.rowNumber}: ${failure.error}`);
      });

      if (failures.length > 5) {
        console.log(`   ... and ${failures.length - 5} more failures`);
      }
    }
  }

  console.log('\n🎉 Import completed successfully!');
}

// Add helper command for column mapping
export const mappingCommand = new Command('mapping')
  .description('Show CSV column mapping examples')
  .action(() => {
    console.log('📊 CSV Column Mapping Examples:\n');

    console.log('Standard format:');
    console.log('Front,Back,Deck,Tags,Model');
    console.log(
      '"What is React?","JavaScript library","React","react,frontend","Basic"'
    );

    console.log('\nCustom mapping:');
    console.log('Question,Answer,DeckName,Categories');
    console.log(
      '"What is React?","JavaScript library","React","react,frontend"'
    );
    console.log(
      'CLI: --mapping \'{"front": "Question", "back": "Answer", "deck": "DeckName", "tags": "Categories"}\''
    );

    console.log('\nMinimal format (Front and Back only):');
    console.log('Front,Back');
    console.log('"What is React?","JavaScript library"');
    console.log('CLI: --deck "Default Deck" --tags "imported"');

    console.log('\nAdvanced example with difficulty:');
    console.log('Question,Answer,Subject,Topics,Level');
    console.log(
      '"What is React?","JavaScript library","React","react,frontend","beginner"'
    );
    console.log(
      'CLI: --mapping \'{"front": "Question", "back": "Answer", "deck": "Subject", "tags": "Topics", "difficulty": "Level"}\''
    );
  });

// Add the mapping subcommand
importCommand.addCommand(mappingCommand);

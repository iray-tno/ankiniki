/**
 * Import Routes - Bulk card import functionality
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import { ankiConnect } from '../services/ankiConnect';
// ValidationError import removed as it's not used in this file

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for CSV files
  },
  fileFilter: (req, file, cb) => {
    // Allow CSV files
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const allowedExtensions = ['.csv', '.txt'];

    const hasAllowedType = allowedTypes.includes(file.mimetype);
    const hasAllowedExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasAllowedType || hasAllowedExtension) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Please upload a CSV file.`
        )
      );
    }
  },
});

// CSV Import Schema
const CsvImportOptionsSchema = z.object({
  delimiter: z.string().optional().default(','),
  defaultDeck: z.string().optional(),
  defaultModel: z.string().optional().default('Basic'),
  defaultTags: z.array(z.string()).optional().default([]),
  skipHeader: z.boolean().optional().default(true),
  dryRun: z.boolean().optional().default(false),
  columnMapping: z
    .object({
      front: z.string().default('Front'),
      back: z.string().default('Back'),
      deck: z.string().optional().default('Deck'),
      tags: z.string().optional().default('Tags'),
      model: z.string().optional().default('Model'),
      difficulty: z.string().optional().default('Difficulty'),
    })
    .optional()
    .default({}),
});

interface CsvRow {
  [key: string]: string;
}

interface ProcessedCard {
  front: string;
  back: string;
  deck: string;
  model: string;
  tags: string[];
  difficulty?: string;
  rowNumber: number;
  success?: boolean;
  error?: string;
  noteId?: number;
}

/**
 * Parse CSV content into structured data
 */
function parseCsvContent(
  content: string,
  options: z.infer<typeof CsvImportOptionsSchema>
): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    const stream = Readable.from([content]);

    stream
      .pipe(
        csv({
          separator: options.delimiter,
          skipEmptyLines: true,
          skipLinesWithError: false,
        })
      )
      .on('data', (row: CsvRow) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', error => {
        reject(error);
      });
  });
}

/**
 * Process CSV rows into card format
 */
function processRows(
  rows: CsvRow[],
  options: z.infer<typeof CsvImportOptionsSchema>
): ProcessedCard[] {
  const { columnMapping, defaultDeck, defaultModel, defaultTags } = options;

  return rows.map((row, index) => {
    // Extract values using column mapping
    const front = row[columnMapping.front] || '';
    const back = row[columnMapping.back] || '';
    const deck = row[columnMapping.deck] || defaultDeck || 'Default';
    const model = row[columnMapping.model] || defaultModel;

    // Parse tags - handle comma-separated strings
    let tags: string[] = [...defaultTags];
    if (row[columnMapping.tags]) {
      const csvTags = row[columnMapping.tags]
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      tags = [...tags, ...csvTags];
    }

    const difficulty = row[columnMapping.difficulty];

    return {
      front: front.trim(),
      back: back.trim(),
      deck: deck.trim(),
      model: model.trim(),
      tags,
      difficulty: difficulty?.trim(),
      rowNumber: index + 1,
    };
  });
}

/**
 * Validate processed cards
 */
function validateCards(cards: ProcessedCard[]): {
  valid: ProcessedCard[];
  errors: ProcessedCard[];
} {
  const valid: ProcessedCard[] = [];
  const errors: ProcessedCard[] = [];

  for (const card of cards) {
    if (!card.front) {
      errors.push({
        ...card,
        success: false,
        error: 'Front field is required',
      });
      continue;
    }

    if (!card.back) {
      errors.push({
        ...card,
        success: false,
        error: 'Back field is required',
      });
      continue;
    }

    if (!card.deck) {
      errors.push({
        ...card,
        success: false,
        error: 'Deck name is required',
      });
      continue;
    }

    valid.push(card);
  }

  return { valid, errors };
}

/**
 * @swagger
 * /api/import/csv:
 *   post:
 *     summary: Import flashcards from CSV file
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               options:
 *                 type: string
 *                 description: JSON string with import options
 *     responses:
 *       200:
 *         description: Import results with success/error details
 */
router.post(
  '/csv',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file uploaded',
        });
      }

      // Parse options from form data
      let options: z.infer<typeof CsvImportOptionsSchema> = {};
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid options JSON format',
          });
        }
      }

      // Validate options
      const validatedOptions = CsvImportOptionsSchema.parse(options);

      logger.info('CSV import started', {
        filename: req.file.originalname,
        size: req.file.size,
        options: validatedOptions,
      });

      // Parse CSV content
      const csvContent = req.file.buffer.toString('utf-8');
      const rows = await parseCsvContent(csvContent, validatedOptions);

      logger.info(`Parsed ${rows.length} rows from CSV`);

      // Process rows into card format
      const processedCards = processRows(rows, validatedOptions);

      // Validate cards
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

      logger.info(
        `Validation complete: ${validCards.length} valid, ${invalidCards.length} invalid`
      );

      // If dry run, return preview without creating cards
      if (validatedOptions.dryRun) {
        return res.json({
          success: true,
          data: {
            dryRun: true,
            totalRows: rows.length,
            validCards: validCards.length,
            invalidCards: invalidCards.length,
            preview: validCards.slice(0, 5), // Show first 5 valid cards
            errors: invalidCards,
          },
        });
      }

      // Check if decks exist and models are valid
      const existingDecks = await ankiConnect.getDeckNames();
      const existingModels = await ankiConnect.modelNames();

      const results: ProcessedCard[] = [];

      // Create cards in Anki
      for (const card of validCards) {
        try {
          // Validate deck exists
          if (!existingDecks.includes(card.deck)) {
            results.push({
              ...card,
              success: false,
              error: `Deck '${card.deck}' does not exist`,
            });
            continue;
          }

          // Validate model exists
          if (!existingModels.includes(card.model)) {
            results.push({
              ...card,
              success: false,
              error: `Model '${card.model}' does not exist`,
            });
            continue;
          }

          // Prepare fields based on model
          const fields: Record<string, string> = {};
          if (card.model === 'Basic') {
            fields['Front'] = card.front;
            fields['Back'] = card.back;
          } else if (card.model === 'Cloze') {
            fields['Text'] = `${card.front}\n\n${card.back}`;
          } else {
            // Default fallback
            fields['Front'] = card.front;
            fields['Back'] = card.back;
          }

          // Add import metadata tags
          const allTags = [
            ...card.tags,
            'csv-import',
            `imported-${new Date().toISOString().split('T')[0]}`,
          ];

          // Add difficulty tag if specified
          if (card.difficulty) {
            allTags.push(`difficulty-${card.difficulty}`);
          }

          const noteId = await ankiConnect.addNote(
            card.deck,
            card.model,
            fields,
            allTags
          );

          results.push({
            ...card,
            success: true,
            noteId,
          });

          logger.info(`Created card ${card.rowNumber}`, { noteId });
        } catch (error) {
          logger.error(`Failed to create card ${card.rowNumber}`, error);
          results.push({
            ...card,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Calculate statistics
      const successfulCards = results.filter(card => card.success).length;
      const failedCards = results.filter(card => !card.success).length;

      logger.info('CSV import completed', {
        total: processedCards.length,
        successful: successfulCards,
        failed: failedCards + invalidCards.length,
      });

      res.json({
        success: true,
        data: {
          totalRows: rows.length,
          processedCards: processedCards.length,
          successfulCards,
          failedCards: failedCards + invalidCards.length,
          results: [...results, ...invalidCards],
          summary: {
            imported: successfulCards,
            failed: failedCards,
            invalid: invalidCards.length,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid import options',
          details: error.errors,
        });
      }

      logger.error('CSV import error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/import/csv/preview:
 *   post:
 *     summary: Preview CSV import without creating cards
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               options:
 *                 type: string
 *                 description: JSON string with import options
 *     responses:
 *       200:
 *         description: Preview of cards to be imported
 */
router.post(
  '/csv/preview',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file uploaded',
        });
      }

      // Parse options with dryRun forced to true
      let options: z.infer<typeof CsvImportOptionsSchema> = { dryRun: true };
      if (req.body.options) {
        try {
          const parsed = JSON.parse(req.body.options);
          options = { ...parsed, dryRun: true };
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid options JSON format',
          });
        }
      }

      const validatedOptions = CsvImportOptionsSchema.parse(options);

      // Parse CSV content
      const csvContent = req.file.buffer.toString('utf-8');
      const rows = await parseCsvContent(csvContent, validatedOptions);

      // Process and validate
      const processedCards = processRows(rows, validatedOptions);
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

      res.json({
        success: true,
        data: {
          preview: true,
          totalRows: rows.length,
          validCards: validCards.length,
          invalidCards: invalidCards.length,
          sampleCards: validCards.slice(0, 10), // Show first 10 valid cards
          errors: invalidCards.slice(0, 10), // Show first 10 errors
          columnMapping: validatedOptions.columnMapping,
          detectedColumns: rows.length > 0 ? Object.keys(rows[0]) : [],
        },
      });
    } catch (error) {
      logger.error('CSV preview error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default router;

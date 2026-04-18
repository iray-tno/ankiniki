/**
 * Import Routes - Bulk card import functionality
 */

import csv from 'csv-parser';
import { Request, Response, Router } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { z } from 'zod';
import {
  CsvImportOptionsSchema,
  JsonImportOptionsSchema,
  MarkdownImportOptionsSchema,
  buildImportTags,
  mapCardFields,
  parseMarkdownCards,
  processJsonCards,
  processRows,
  validateCards,
  type CsvRow,
  type JsonCard,
  type JsonImportFormat,
  type ProcessedCard,
} from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import { logger } from '../utils/logger';
import { ok, sendProblem, PROBLEM_TYPES } from '../utils/response';

// Extend Request interface for multer
interface MulterRequest extends Request {
  file?: any;
}

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for import files
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow CSV and JSON files
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'text/plain',
      'application/json',
      'text/json',
    ];
    const allowedExtensions = ['.csv', '.txt', '.json', '.md', '.markdown'];

    const hasAllowedType = allowedTypes.includes(file.mimetype);
    const hasAllowedExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasAllowedType || hasAllowedExtension) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Please upload a CSV, JSON, or Markdown file.`
        )
      );
    }
  },
});

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
        })
      )
      .on('data', (row: CsvRow) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error: any) => {
        reject(error);
      });
  });
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
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No CSV file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      // Parse options from form data
      let options: Partial<z.infer<typeof CsvImportOptionsSchema>> = {};
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch (error) {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
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
        return res.json(
          ok({
            dryRun: true,
            totalRows: rows.length,
            validCards: validCards.length,
            invalidCards: invalidCards.length,
            preview: validCards.slice(0, 5),
            errors: invalidCards,
          })
        );
      }

      // Check if decks exist and models are valid
      const existingDecks = new Set(await ankiConnect.getDeckNames());
      const existingModels = await ankiConnect.modelNames();

      const results: ProcessedCard[] = [];

      // Create cards in Anki
      for (const card of validCards) {
        try {
          // Validate/Create deck
          const deckOk = await ankiConnect.ensureDeckExists(
            card.deck,
            existingDecks
          );
          if (!deckOk) {
            results.push({
              ...card,
              success: false,
              error: `Failed to create or find deck '${card.deck}'`,
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

          const fields = mapCardFields(card.front, card.back, card.model);
          const allTags = buildImportTags(card.tags, 'csv', card.difficulty);

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

      res.json(
        ok({
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
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendProblem(res, 400, 'Invalid import options', {
          type: PROBLEM_TYPES.VALIDATION,
          errors: error.errors,
        });
      }

      logger.error('CSV import error:', error);
      sendProblem(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
        { type: PROBLEM_TYPES.INTERNAL }
      );
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
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No CSV file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      // Parse options with dryRun forced to true
      let options: Partial<z.infer<typeof CsvImportOptionsSchema>> = {
        dryRun: true,
      };
      if (req.body.options) {
        try {
          const parsed = JSON.parse(req.body.options);
          options = { ...parsed, dryRun: true };
        } catch (error) {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
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

      res.json(
        ok({
          preview: true,
          totalRows: rows.length,
          validCards: validCards.length,
          invalidCards: invalidCards.length,
          sampleCards: validCards.slice(0, 10),
          errors: invalidCards.slice(0, 10),
          columnMapping: validatedOptions.columnMapping,
          detectedColumns: rows.length > 0 ? Object.keys(rows[0]) : [],
        })
      );
    } catch (error) {
      logger.error('CSV preview error:', error);
      sendProblem(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
        { type: PROBLEM_TYPES.INTERNAL }
      );
    }
  }
);

/**
 * @swagger
 * /api/import/json:
 *   post:
 *     summary: Import flashcards from JSON file
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
  '/json',
  upload.single('file'),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No JSON file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      // Parse options from form data
      let options: Partial<z.infer<typeof JsonImportOptionsSchema>> = {};
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch (error) {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
          });
        }
      }

      // Validate options
      const validatedOptions = JsonImportOptionsSchema.parse(options);

      logger.info('JSON import started', {
        filename: req.file.originalname,
        size: req.file.size,
        options: validatedOptions,
      });

      // Parse JSON content
      let jsonData: JsonImportFormat | JsonCard[];
      try {
        const jsonContent = req.file.buffer.toString('utf-8');
        jsonData = JSON.parse(jsonContent);
      } catch (error) {
        return sendProblem(res, 400, 'Invalid JSON format in uploaded file', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      // Process JSON into cards
      const processedCards = processJsonCards(jsonData, validatedOptions);

      logger.info(`Processed ${processedCards.length} cards from JSON`);

      // Validate cards
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

      logger.info(
        `Validation complete: ${validCards.length} valid, ${invalidCards.length} invalid`
      );

      // If dry run, return preview without creating cards
      if (validatedOptions.dryRun) {
        return res.json(
          ok({
            dryRun: true,
            totalCards: processedCards.length,
            validCards: validCards.length,
            invalidCards: invalidCards.length,
            preview: validCards.slice(0, 5),
            errors: invalidCards,
          })
        );
      }

      // Check if decks exist and models are valid
      const existingDecks = new Set(await ankiConnect.getDeckNames());
      const existingModels = await ankiConnect.modelNames();

      const results: ProcessedCard[] = [];

      // Create cards in Anki
      for (const card of validCards) {
        try {
          // Validate/Create deck
          const deckOk = await ankiConnect.ensureDeckExists(
            card.deck,
            existingDecks
          );
          if (!deckOk) {
            results.push({
              ...card,
              success: false,
              error: `Failed to create or find deck '${card.deck}'`,
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

          const fields = mapCardFields(card.front, card.back, card.model);
          const allTags = buildImportTags(card.tags, 'json', card.difficulty);

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

      logger.info('JSON import completed', {
        total: processedCards.length,
        successful: successfulCards,
        failed: failedCards + invalidCards.length,
      });

      res.json(
        ok({
          totalCards: processedCards.length,
          successfulCards,
          failedCards: failedCards + invalidCards.length,
          results: [...results, ...invalidCards],
          summary: {
            imported: successfulCards,
            failed: failedCards,
            invalid: invalidCards.length,
          },
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendProblem(res, 400, 'Invalid import options', {
          type: PROBLEM_TYPES.VALIDATION,
          errors: error.errors,
        });
      }

      logger.error('JSON import error:', error);
      sendProblem(
        res,
        500,
        error instanceof Error
          ? error.message
          : String(error) || 'Internal server error',
        { type: PROBLEM_TYPES.INTERNAL }
      );
    }
  }
);

/**
 * @swagger
 * /api/import/json/preview:
 *   post:
 *     summary: Preview JSON import without creating cards
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
  '/json/preview',
  upload.single('file'),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No JSON file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      // Parse options with dryRun forced to true
      let options: Partial<z.infer<typeof JsonImportOptionsSchema>> = {
        dryRun: true,
      };
      if (req.body.options) {
        try {
          const parsed = JSON.parse(req.body.options);
          options = { ...parsed, dryRun: true };
        } catch (error) {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
          });
        }
      }

      const validatedOptions = JsonImportOptionsSchema.parse(options);

      // Parse JSON content
      let jsonData: JsonImportFormat | JsonCard[];
      try {
        const jsonContent = req.file.buffer.toString('utf-8');
        jsonData = JSON.parse(jsonContent);
      } catch (error) {
        return sendProblem(res, 400, 'Invalid JSON format in uploaded file', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      // Process and validate
      const processedCards = processJsonCards(jsonData, validatedOptions);
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

      // Detect format type
      let formatType = 'unknown';
      if (Array.isArray(jsonData)) {
        formatType = 'array';
      } else if (jsonData.cards) {
        formatType = 'object_with_cards';
      }

      res.json(
        ok({
          preview: true,
          totalCards: processedCards.length,
          validCards: validCards.length,
          invalidCards: invalidCards.length,
          sampleCards: validCards.slice(0, 10),
          errors: invalidCards.slice(0, 10),
          formatType,
          detectedStructure: {
            hasCards: Array.isArray(jsonData) || Boolean(jsonData.cards),
            hasDeckName:
              !Array.isArray(jsonData) && Boolean(jsonData.deck_name),
            hasDefaultTags:
              !Array.isArray(jsonData) && Boolean(jsonData.default_tags),
            hasDefaultModel:
              !Array.isArray(jsonData) && Boolean(jsonData.default_model),
          },
        })
      );
    } catch (error) {
      logger.error('JSON preview error:', error);
      sendProblem(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
        { type: PROBLEM_TYPES.INTERNAL }
      );
    }
  }
);

// ─── Markdown Import ─────────────────────────────────────────────────────────

router.post(
  '/markdown',
  upload.single('file'),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      let options: Partial<z.infer<typeof MarkdownImportOptionsSchema>> = {};
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
          });
        }
      }
      const validatedOptions = MarkdownImportOptionsSchema.parse(options);

      const content = req.file.buffer.toString('utf-8');
      const processedCards = parseMarkdownCards(content, validatedOptions);
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

      logger.info('Markdown import started', {
        filename: req.file.originalname,
        cards: processedCards.length,
      });

      if (validatedOptions.dryRun) {
        return res.json(
          ok({
            dryRun: true,
            totalCards: processedCards.length,
            validCards: validCards.length,
            invalidCards: invalidCards.length,
            preview: validCards.slice(0, 5),
            errors: invalidCards,
          })
        );
      }

      const existingDecks = new Set(await ankiConnect.getDeckNames());
      const existingModels = await ankiConnect.modelNames();
      const results: ProcessedCard[] = [];

      for (const card of validCards) {
        try {
          // Validate/Create deck
          const deckOk = await ankiConnect.ensureDeckExists(
            card.deck,
            existingDecks
          );
          if (!deckOk) {
            results.push({
              ...card,
              success: false,
              error: `Failed to create or find deck '${card.deck}'`,
            });
            continue;
          }

          if (!existingModels.includes(card.model)) {
            results.push({
              ...card,
              success: false,
              error: `Model '${card.model}' does not exist`,
            });
            continue;
          }

          const fields = mapCardFields(card.front, card.back, card.model);
          const allTags = buildImportTags(card.tags, 'markdown');

          const noteId = await ankiConnect.addNote(
            card.deck,
            card.model,
            fields,
            allTags
          );
          results.push({ ...card, success: true, noteId });
        } catch (error) {
          results.push({
            ...card,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successfulCards = results.filter(c => c.success).length;
      const failedCards = results.filter(c => !c.success).length;

      res.json(
        ok({
          totalCards: processedCards.length,
          successfulCards,
          failedCards: failedCards + invalidCards.length,
          results: [...results, ...invalidCards],
          summary: {
            imported: successfulCards,
            failed: failedCards,
            invalid: invalidCards.length,
          },
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendProblem(res, 400, 'Invalid import options', {
          type: PROBLEM_TYPES.VALIDATION,
          errors: error.errors,
        });
      }
      logger.error('Markdown import error:', error);
      sendProblem(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
        { type: PROBLEM_TYPES.INTERNAL }
      );
    }
  }
);

router.post(
  '/markdown/preview',
  upload.single('file'),
  async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      let options: Partial<z.infer<typeof MarkdownImportOptionsSchema>> = {
        dryRun: true,
      };
      if (req.body.options) {
        try {
          options = { ...JSON.parse(req.body.options), dryRun: true };
        } catch {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
          });
        }
      }
      const validatedOptions = MarkdownImportOptionsSchema.parse(options);

      const content = req.file.buffer.toString('utf-8');
      const processedCards = parseMarkdownCards(content, validatedOptions);
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

      res.json(
        ok({
          preview: true,
          totalCards: processedCards.length,
          validCards: validCards.length,
          invalidCards: invalidCards.length,
          sampleCards: validCards.slice(0, 10),
          errors: invalidCards.slice(0, 10),
        })
      );
    } catch (error) {
      logger.error('Markdown preview error:', error);
      sendProblem(
        res,
        500,
        error instanceof Error ? error.message : 'Internal server error',
        { type: PROBLEM_TYPES.INTERNAL }
      );
    }
  }
);

// ─── JSON body endpoint (for programmatic use, e.g. blog "Export to Anki") ───

router.post('/json/body', async (req: Request, res: Response) => {
  try {
    const { cards, options: rawOptions } = req.body as {
      cards?: unknown;
      options?: unknown;
    };

    if (!cards) {
      return sendProblem(res, 400, 'Missing "cards" field in request body', {
        type: PROBLEM_TYPES.VALIDATION,
      });
    }

    const validatedOptions = JsonImportOptionsSchema.parse(rawOptions ?? {});
    const jsonData: JsonImportFormat | JsonCard[] = Array.isArray(cards)
      ? (cards as JsonCard[])
      : { cards: cards as JsonCard[] };

    const processedCards = processJsonCards(jsonData, validatedOptions);
    const { valid: validCards, errors: invalidCards } =
      validateCards(processedCards);

    logger.info('JSON body import started', { cards: processedCards.length });

    if (validatedOptions.dryRun) {
      return res.json(
        ok({
          dryRun: true,
          totalCards: processedCards.length,
          validCards: validCards.length,
          invalidCards: invalidCards.length,
          preview: validCards.slice(0, 5),
          errors: invalidCards,
        })
      );
    }

    const existingDecks = new Set(await ankiConnect.getDeckNames());
    const existingModels = await ankiConnect.modelNames();
    const results: ProcessedCard[] = [];

    for (const card of validCards) {
      try {
        // Validate/Create deck
        const deckOk = await ankiConnect.ensureDeckExists(
          card.deck,
          existingDecks
        );
        if (!deckOk) {
          results.push({
            ...card,
            success: false,
            error: `Failed to create or find deck '${card.deck}'`,
          });
          continue;
        }

        if (!existingModels.includes(card.model)) {
          results.push({
            ...card,
            success: false,
            error: `Model '${card.model}' does not exist`,
          });
          continue;
        }

        const fields = mapCardFields(card.front, card.back, card.model);
        const allTags = buildImportTags(
          card.tags,
          'json-body',
          card.difficulty
        );

        const noteId = await ankiConnect.addNote(
          card.deck,
          card.model,
          fields,
          allTags
        );
        results.push({ ...card, success: true, noteId });
      } catch (error) {
        results.push({
          ...card,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successfulCards = results.filter(c => c.success).length;
    const failedCards = results.filter(c => !c.success).length;

    res.json(
      ok({
        totalCards: processedCards.length,
        successfulCards,
        failedCards: failedCards + invalidCards.length,
        results: [...results, ...invalidCards],
        summary: {
          imported: successfulCards,
          failed: failedCards,
          invalid: invalidCards.length,
        },
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendProblem(res, 400, 'Invalid import options', {
        type: PROBLEM_TYPES.VALIDATION,
        errors: error.errors,
      });
    }
    logger.error('JSON body import error:', error);
    sendProblem(
      res,
      500,
      error instanceof Error ? error.message : 'Internal server error',
      { type: PROBLEM_TYPES.INTERNAL }
    );
  }
});

export default router;

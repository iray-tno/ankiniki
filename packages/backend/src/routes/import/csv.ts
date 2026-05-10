import csv from 'csv-parser';
import { Request, Response, Router } from 'express';
import { Readable } from 'stream';
import { z } from 'zod';
import {
  CsvImportOptionsSchema,
  processRows,
  validateCards,
  type CsvRow,
} from '@ankiniki/shared';
import { logger } from '../../utils/logger';
import { ok, sendProblem, PROBLEM_TYPES } from '../../utils/response';
import { upload, createCards } from './shared';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

function parseCsvContent(
  content: string,
  options: z.infer<typeof CsvImportOptionsSchema>
): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    Readable.from([content])
      .pipe(csv({ separator: options.delimiter }))
      .on('data', (row: CsvRow) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * @swagger
 * /api/import/csv:
 *   post:
 *     summary: Import flashcards from CSV file
 *     tags: [Import]
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No CSV file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      let options: Partial<z.infer<typeof CsvImportOptionsSchema>> = {};
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
          });
        }
      }

      const validatedOptions = CsvImportOptionsSchema.parse(options);

      logger.info('CSV import started', {
        filename: req.file.originalname,
        size: req.file.size,
        options: validatedOptions,
      });

      const rows = await parseCsvContent(
        req.file.buffer.toString('utf-8'),
        validatedOptions
      );
      logger.info(`Parsed ${rows.length} rows from CSV`);

      const processedCards = processRows(rows, validatedOptions);
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);
      logger.info(
        `Validation complete: ${validCards.length} valid, ${invalidCards.length} invalid`
      );

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

      const { results, successfulCards, failedCards } = await createCards(
        validCards,
        invalidCards,
        'csv'
      );

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
        {
          type: PROBLEM_TYPES.INTERNAL,
        }
      );
    }
  })
);

/**
 * @swagger
 * /api/import/csv/preview:
 *   post:
 *     summary: Preview CSV import without creating cards
 *     tags: [Import]
 */
router.post(
  '/preview',
  upload.single('file'),
  asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No CSV file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      let options: Partial<z.infer<typeof CsvImportOptionsSchema>> = {
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

      const validatedOptions = CsvImportOptionsSchema.parse(options);
      const rows = await parseCsvContent(
        req.file.buffer.toString('utf-8'),
        validatedOptions
      );
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
        {
          type: PROBLEM_TYPES.INTERNAL,
        }
      );
    }
  })
);

export default router;

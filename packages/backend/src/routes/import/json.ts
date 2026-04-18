import { Request, Response, Router } from 'express';
import { z } from 'zod';
import {
  JsonImportOptionsSchema,
  processJsonCards,
  validateCards,
  type JsonCard,
  type JsonImportFormat,
} from '@ankiniki/shared';
import { logger } from '../../utils/logger';
import { ok, sendProblem, PROBLEM_TYPES } from '../../utils/response';
import { upload, createCards } from './shared';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

interface MulterRequest extends Request {
  file?: any;
}

/**
 * @swagger
 * /api/import/json:
 *   post:
 *     summary: Import flashcards from JSON file
 *     tags: [Import]
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No JSON file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      let options: Partial<z.infer<typeof JsonImportOptionsSchema>> = {};
      if (req.body.options) {
        try {
          options = JSON.parse(req.body.options);
        } catch {
          return sendProblem(res, 400, 'Invalid options JSON format', {
            type: PROBLEM_TYPES.VALIDATION,
          });
        }
      }

      const validatedOptions = JsonImportOptionsSchema.parse(options);

      logger.info('JSON import started', {
        filename: req.file.originalname,
        size: req.file.size,
        options: validatedOptions,
      });

      let jsonData: JsonImportFormat | JsonCard[];
      try {
        jsonData = JSON.parse(req.file.buffer.toString('utf-8'));
      } catch {
        return sendProblem(res, 400, 'Invalid JSON format in uploaded file', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      const processedCards = processJsonCards(jsonData, validatedOptions);
      logger.info(`Processed ${processedCards.length} cards from JSON`);

      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);
      logger.info(
        `Validation complete: ${validCards.length} valid, ${invalidCards.length} invalid`
      );

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

      const { results, successfulCards, failedCards } = await createCards(
        validCards,
        invalidCards,
        'json'
      );

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
 * /api/import/json/preview:
 *   post:
 *     summary: Preview JSON import without creating cards
 *     tags: [Import]
 */
router.post(
  '/preview',
  upload.single('file'),
  asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No JSON file uploaded', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      let options: Partial<z.infer<typeof JsonImportOptionsSchema>> = {
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

      const validatedOptions = JsonImportOptionsSchema.parse(options);

      let jsonData: JsonImportFormat | JsonCard[];
      try {
        jsonData = JSON.parse(req.file.buffer.toString('utf-8'));
      } catch {
        return sendProblem(res, 400, 'Invalid JSON format in uploaded file', {
          type: PROBLEM_TYPES.VALIDATION,
        });
      }

      const processedCards = processJsonCards(jsonData, validatedOptions);
      const { valid: validCards, errors: invalidCards } =
        validateCards(processedCards);

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
        {
          type: PROBLEM_TYPES.INTERNAL,
        }
      );
    }
  })
);

/**
 * POST /api/import/json/body
 * Programmatic JSON import — accepts cards directly in the request body.
 */
router.post(
  '/body',
  asyncHandler(async (req: Request, res: Response) => {
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

      const { results, successfulCards, failedCards } = await createCards(
        validCards,
        invalidCards,
        'json-body'
      );

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
        {
          type: PROBLEM_TYPES.INTERNAL,
        }
      );
    }
  })
);

export default router;

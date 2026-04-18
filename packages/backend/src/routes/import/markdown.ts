import { Request, Response, Router } from 'express';
import { z } from 'zod';
import {
  MarkdownImportOptionsSchema,
  parseMarkdownCards,
  validateCards,
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
 * /api/import/markdown:
 *   post:
 *     summary: Import flashcards from Markdown file
 *     tags: [Import]
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No Markdown file uploaded', {
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
      const processedCards = parseMarkdownCards(
        req.file.buffer.toString('utf-8'),
        validatedOptions
      );
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

      const { results, successfulCards, failedCards } = await createCards(
        validCards,
        invalidCards,
        'markdown'
      );

      logger.info('Markdown import completed', {
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
      logger.error('Markdown import error:', error);
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
 * /api/import/markdown/preview:
 *   post:
 *     summary: Preview Markdown import without creating cards
 *     tags: [Import]
 */
router.post(
  '/preview',
  upload.single('file'),
  asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return sendProblem(res, 400, 'No Markdown file uploaded', {
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
      const processedCards = parseMarkdownCards(
        req.file.buffer.toString('utf-8'),
        validatedOptions
      );
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
        {
          type: PROBLEM_TYPES.INTERNAL,
        }
      );
    }
  })
);

export default router;

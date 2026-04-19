import { Router, Response } from 'express';
import { z } from 'zod';
import { ApiResponse, ValidationError } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import {
  assertDeckExists,
  assertDeckNotExists,
} from '../services/ankiValidation';
import { logger } from '../utils/logger';
import { ok } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Get all decks
router.get(
  '/',
  asyncHandler(async (req, res: Response<ApiResponse<string[]>>) => {
    try {
      const deckNames = await ankiConnect.getDeckNames();
      res.json(ok(deckNames));
    } catch (error) {
      logger.error('Failed to get decks', error);
      throw error;
    }
  })
);

// Create deck
const CreateDeckSchema = z.object({
  name: z.string().min(1).max(100),
});

router.post(
  '/',
  asyncHandler(async (req, res: Response<ApiResponse<{ id: number }>>) => {
    try {
      const { name } = CreateDeckSchema.parse(req.body);

      await assertDeckNotExists(name);

      const deckId = await ankiConnect.createDeck(name);

      res
        .status(201)
        .json(ok({ id: deckId }, `Deck '${name}' created successfully`));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid deck data: ${error.message}`);
      }
      throw error;
    }
  })
);

// Delete deck
const DeleteDeckSchema = z.object({
  name: z.string().min(1),
  deleteCards: z.boolean().default(false),
});

router.delete(
  '/:name',
  asyncHandler(async (req, res: Response<ApiResponse>) => {
    try {
      const { name } = req.params;
      const { deleteCards } = DeleteDeckSchema.parse(req.body);

      await assertDeckExists(name);

      await ankiConnect.deleteDeck(name, deleteCards);

      res.json(ok(null, `Deck '${name}' deleted successfully`));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid delete request: ${error.message}`);
      }
      throw error;
    }
  })
);

export default router;

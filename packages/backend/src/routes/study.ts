import { Router, Response } from 'express';
import { z } from 'zod';
import { ApiResponse, ValidationError } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import { ok } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Get due cards for a deck (or all decks)
router.get(
  '/due',
  asyncHandler(async (req, res: Response<ApiResponse>) => {
    const deck = z.string().optional().parse(req.query.deck);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .parse(req.query.limit);

    const query = deck ? `deck:"${deck}" is:due` : 'is:due';
    const cardIds = await ankiConnect.findCards(query);
    const cards = await ankiConnect.cardsInfo(cardIds.slice(0, limit));

    res.json(ok({ cards, total: cardIds.length }));
  })
);

// Submit an answer for a card
const AnswerSchema = z.object({
  cardId: z.number().int(),
  ease: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

router.post(
  '/answer',
  asyncHandler(async (req, res: Response<ApiResponse>) => {
    try {
      const { cardId, ease } = AnswerSchema.parse(req.body);
      await ankiConnect.answerCards([{ cardId, ease }]);
      res.json(ok(null, 'Answer recorded'));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid answer data: ${error.message}`);
      }
      throw error;
    }
  })
);

export default router;

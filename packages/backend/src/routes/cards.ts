import { Router, Response } from 'express';
import { z } from 'zod';
import { ApiResponse, ValidationError, ANKI_MODELS } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
import {
  assertDeckExists,
  assertModelExists,
} from '../services/ankiValidation';
import mlService from '../services/mlService';
import { logger } from '../utils/logger';
import { ok } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Add note/card
const AddNoteSchema = z.object({
  deckName: z.string().min(1),
  modelName: z.string().default(ANKI_MODELS.BASIC),
  fields: z.record(z.string()),
  tags: z.array(z.string()).default([]),
});

router.post(
  '/',
  asyncHandler(async (req, res: Response<ApiResponse<{ noteId: number }>>) => {
    try {
      const { deckName, modelName, fields, tags } = AddNoteSchema.parse(
        req.body
      );

      await Promise.all([
        assertDeckExists(deckName),
        assertModelExists(modelName),
      ]);

      const noteId = await ankiConnect.addNote(
        deckName,
        modelName,
        fields,
        tags
      );

      res.status(201).json(ok({ noteId }, 'Card created successfully'));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid card data: ${error.message}`);
      }
      throw error;
    }
  })
);

// Update note fields
const UpdateNoteSchema = z.object({
  noteId: z.number(),
  fields: z.record(z.string()),
});

router.put(
  '/',
  asyncHandler(async (req, res: Response<ApiResponse>) => {
    try {
      const { noteId, fields } = UpdateNoteSchema.parse(req.body);

      await ankiConnect.updateNoteFields(noteId, fields);

      res.json(ok(null, 'Card updated successfully'));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid update data: ${error.message}`);
      }
      throw error;
    }
  })
);

// Delete notes
const DeleteNotesSchema = z.object({
  noteIds: z.array(z.number()),
});

router.delete(
  '/',
  asyncHandler(async (req, res: Response<ApiResponse>) => {
    try {
      const { noteIds } = DeleteNotesSchema.parse(req.body);

      await ankiConnect.deleteNotes(noteIds);

      res.json(ok(null, `${noteIds.length} card(s) deleted successfully`));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid delete data: ${error.message}`);
      }
      throw error;
    }
  })
);

// Search notes
router.get(
  '/search',
  asyncHandler(async (req, res: Response<ApiResponse<unknown[]>>) => {
    try {
      const query = z.string().parse(req.query.q);

      const noteIds = await ankiConnect.findNotes(query);
      const notesInfo = await ankiConnect.notesInfo(noteIds);

      res.json(ok(notesInfo));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid search query');
      }
      throw error;
    }
  })
);

// AI-powered card generation with automatic Anki creation
const GenerateAndCreateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  content_type: z.enum(['code', 'markdown', 'text', 'html']),
  deckName: z.string().min(1, 'Deck name is required'),
  modelName: z.string().default(ANKI_MODELS.BASIC),
  difficulty_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .default('intermediate'),
  max_cards: z.number().int().min(1).max(20).optional().default(5),
  focus_areas: z.array(z.string()).optional(),
  programming_language: z.string().optional(),
  additional_tags: z.array(z.string()).optional().default([]),
  auto_enhance_questions: z.boolean().optional().default(false),
});

router.post(
  '/generate-and-create',
  asyncHandler(
    async (
      req,
      res: Response<
        ApiResponse<{
          generated_cards: number;
          created_notes: Array<{
            noteId: number;
            front: string;
            success: boolean;
            error?: string;
          }>;
          ml_available: boolean;
        }>
      >
    ) => {
      try {
        const validatedData = GenerateAndCreateSchema.parse(req.body);

        logger.info('AI-powered card generation and creation requested', {
          content_type: validatedData.content_type,
          deck: validatedData.deckName,
          max_cards: validatedData.max_cards,
          programming_language: validatedData.programming_language,
        });

        await Promise.all([
          assertDeckExists(validatedData.deckName),
          assertModelExists(validatedData.modelName),
        ]);

        // Generate cards using ML service
        const mlResult = await mlService.generateCards({
          content: validatedData.content,
          content_type: validatedData.content_type,
          difficulty_level: validatedData.difficulty_level,
          max_cards: validatedData.max_cards,
          focus_areas: validatedData.focus_areas,
          programming_language: validatedData.programming_language,
          tags: validatedData.additional_tags,
        });

        if (!mlResult.success) {
          throw new ValidationError(
            `Failed to generate cards: ${mlResult.error}`
          );
        }

        const createdNotes: Array<{
          noteId: number;
          front: string;
          success: boolean;
          error?: string;
        }> = [];

        // Create cards in Anki
        for (const card of mlResult.cards) {
          try {
            // Enhance question if requested
            let front = card.front;
            if (validatedData.auto_enhance_questions && card.front) {
              const enhanceResult = await mlService.enhanceQuestion({
                original_question: card.front,
                context: card.back,
                target_difficulty: validatedData.difficulty_level,
                question_type: 'concept',
                programming_language: validatedData.programming_language,
              });

              if (enhanceResult.success) {
                front = enhanceResult.enhanced_question.enhanced_question;
              }
            }

            // Prepare fields based on model
            const fields: Record<string, string> = {};
            if (validatedData.modelName === ANKI_MODELS.BASIC) {
              fields['Front'] = front;
              fields['Back'] = card.back;
            } else if (validatedData.modelName === ANKI_MODELS.CLOZE) {
              // For cloze, put everything in Text field
              fields['Text'] = `${front}\n\n${card.back}`;
            } else {
              // Default fallback
              fields['Front'] = front;
              fields['Back'] = card.back;
            }

            // Combine ML-generated tags with user tags
            const allTags = [
              ...card.tags,
              ...validatedData.additional_tags,
              'ai-generated',
              `difficulty-${card.difficulty}`,
              `confidence-${Math.round(card.confidence_score * 100)}`,
            ];

            // Add programming language tag if available
            if (validatedData.programming_language) {
              allTags.push(validatedData.programming_language);
            }

            const noteId = await ankiConnect.addNote(
              validatedData.deckName,
              validatedData.modelName,
              fields,
              allTags
            );

            createdNotes.push({
              noteId,
              front,
              success: true,
            });

            logger.info('Successfully created AI-generated card', {
              noteId,
              confidence: card.confidence_score,
            });
          } catch (error) {
            logger.error('Failed to create AI-generated card', error);
            createdNotes.push({
              noteId: -1,
              front: card.front,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        const successfulCards = createdNotes.filter(
          note => note.success
        ).length;

        res.status(201).json(
          ok(
            {
              generated_cards: mlResult.cards.length,
              created_notes: createdNotes,
              ml_available: mlService.getAvailability(),
            },
            `Successfully generated ${mlResult.cards.length} cards and created ${successfulCards} in Anki`
          )
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(`Invalid request data: ${error.message}`);
        }
        throw error;
      }
    }
  )
);

export default router;

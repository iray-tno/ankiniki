import { Router, Response } from 'express';
import { z } from 'zod';
import { ApiResponse, ValidationError } from '@ankiniki/shared';
import { ankiConnect } from '../services/ankiConnect';
// import { logger } from '../utils/logger';

const router = Router();

// Add note/card
const AddNoteSchema = z.object({
  deckName: z.string().min(1),
  modelName: z.string().default('Basic'),
  fields: z.record(z.string()),
  tags: z.array(z.string()).default([]),
});

router.post(
  '/',
  async (req, res: Response<ApiResponse<{ noteId: number }>>) => {
    try {
      const { deckName, modelName, fields, tags } = AddNoteSchema.parse(
        req.body
      );

      // Validate deck exists
      const existingDecks = await ankiConnect.getDeckNames();
      if (!existingDecks.includes(deckName)) {
        throw new ValidationError(`Deck '${deckName}' does not exist`);
      }

      // Validate model exists
      const existingModels = await ankiConnect.modelNames();
      if (!existingModels.includes(modelName)) {
        throw new ValidationError(`Model '${modelName}' does not exist`);
      }

      const noteId = await ankiConnect.addNote(
        deckName,
        modelName,
        fields,
        tags
      );

      res.status(201).json({
        success: true,
        data: { noteId },
        message: 'Card created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid card data: ${error.message}`);
      }
      throw error;
    }
  }
);

// Update note fields
const UpdateNoteSchema = z.object({
  noteId: z.number(),
  fields: z.record(z.string()),
});

router.put('/', async (req, res: Response<ApiResponse>) => {
  try {
    const { noteId, fields } = UpdateNoteSchema.parse(req.body);

    await ankiConnect.updateNoteFields(noteId, fields);

    res.json({
      success: true,
      message: 'Card updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Invalid update data: ${error.message}`);
    }
    throw error;
  }
});

// Delete notes
const DeleteNotesSchema = z.object({
  noteIds: z.array(z.number()),
});

router.delete('/', async (req, res: Response<ApiResponse>) => {
  try {
    const { noteIds } = DeleteNotesSchema.parse(req.body);

    await ankiConnect.deleteNotes(noteIds);

    res.json({
      success: true,
      message: `${noteIds.length} card(s) deleted successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Invalid delete data: ${error.message}`);
    }
    throw error;
  }
});

// Search notes
router.get('/search', async (req, res: Response<ApiResponse<any[]>>) => {
  try {
    const query = z.string().parse(req.query.q);

    const noteIds = await ankiConnect.findNotes(query);
    const notesInfo = await ankiConnect.notesInfo(noteIds);

    res.json({
      success: true,
      data: notesInfo,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid search query');
    }
    throw error;
  }
});

export default router;

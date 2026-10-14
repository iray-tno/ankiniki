/**
 * Shared utilities for all import route handlers.
 */

import multer from 'multer';
import {
  buildImportTags,
  mapCardFields,
  validateCards,
  type ImportSource,
  type ProcessedCard,
} from '@ankiniki/shared';
import { ankiConnect } from '../../services/ankiConnect';
import { logger } from '../../utils/logger';

// ─── Multer ───────────────────────────────────────────────────────────────────

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
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

// ─── Card creation loop ───────────────────────────────────────────────────────

interface CreateCardsResult {
  results: ProcessedCard[];
  successfulCards: number;
  failedCards: number;
}

/** Preview and apply share the same non-mutating model compatibility check. */
export async function validateJsonCards(cards: ProcessedCard[]): Promise<{
  valid: ProcessedCard[];
  errors: ProcessedCard[];
}> {
  const structural = validateCards(cards);
  if (!structural.valid.some(card => card.fields)) {
    return structural;
  }
  const models = new Set(await ankiConnect.modelNames());
  const modelFields = new Map<string, string[]>();
  const valid: ProcessedCard[] = [];
  const errors = [...structural.errors];

  for (const card of structural.valid) {
    if (!card.fields) {
      valid.push(card);
      continue;
    }
    if (!models.has(card.model)) {
      errors.push({
        ...card,
        success: false,
        error: `Model '${card.model}' does not exist`,
      });
      continue;
    }
    let expected = modelFields.get(card.model);
    if (!expected) {
      expected = await ankiConnect.modelFieldNames(card.model);
      modelFields.set(card.model, expected);
    }
    const fields = card.fields;
    const missing = expected.filter(name => !Object.hasOwn(fields, name));
    const extra = Object.keys(fields).filter(name => !expected.includes(name));
    if (missing.length || extra.length) {
      errors.push({
        ...card,
        success: false,
        error: `Fields do not match model '${card.model}' (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})`,
      });
      continue;
    }
    valid.push(card);
  }
  return { valid, errors };
}

/**
 * Create validated cards in Anki and return per-card results.
 * Handles deck creation, model validation, field mapping, and tag building.
 */
export async function createCards(
  validCards: ProcessedCard[],
  invalidCards: ProcessedCard[],
  source: ImportSource
): Promise<CreateCardsResult> {
  const existingDecks = new Set(await ankiConnect.getDeckNames());
  const existingModels = await ankiConnect.modelNames();
  const results: ProcessedCard[] = [];

  for (const card of validCards) {
    try {
      if (!existingModels.includes(card.model)) {
        results.push({
          ...card,
          success: false,
          error: `Model '${card.model}' does not exist`,
        });
        continue;
      }

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

      const fields =
        card.fields ?? mapCardFields(card.front, card.back, card.model);
      const allTags = card.fields
        ? card.tags
        : buildImportTags(card.tags, source, card.difficulty);

      const noteId = await ankiConnect.addNote(
        card.deck,
        card.model,
        fields,
        allTags
      );

      results.push({ ...card, success: true, noteId });
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

  return {
    results,
    successfulCards: results.filter(c => c.success).length,
    failedCards: results.filter(c => !c.success).length,
  };
}

export { validateCards };

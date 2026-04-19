/**
 * Validation helpers that check Anki state and throw ValidationError on failure.
 * Use these in route handlers instead of fetching deck/model lists inline.
 *
 * Note: import/shared.ts has its own loop-optimised variant (pre-fetches once
 * before iterating many cards) — don't replace that with these per-call helpers.
 */

import { ValidationError } from '@ankiniki/shared';
import { ankiConnect } from './ankiConnect';

/** Throws if the deck does not exist in Anki. */
export async function assertDeckExists(deckName: string): Promise<void> {
  const decks = await ankiConnect.getDeckNames();
  if (!decks.includes(deckName)) {
    throw new ValidationError(`Deck '${deckName}' does not exist`);
  }
}

/** Throws if the deck already exists in Anki. */
export async function assertDeckNotExists(deckName: string): Promise<void> {
  const decks = await ankiConnect.getDeckNames();
  if (decks.includes(deckName)) {
    throw new ValidationError(`Deck '${deckName}' already exists`);
  }
}

/** Throws if the note-type model does not exist in Anki. */
export async function assertModelExists(modelName: string): Promise<void> {
  const models = await ankiConnect.modelNames();
  if (!models.includes(modelName)) {
    throw new ValidationError(`Model '${modelName}' does not exist`);
  }
}

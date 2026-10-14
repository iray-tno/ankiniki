import { z } from 'zod';
import type { NoteInfo } from './anki-client';

/** Note content, not a backup of models, media, card decks or review state. */
export const AnkiNoteRecordSchema = z
  .object({
    noteId: z.number().int().safe().nonnegative().optional(),
    deckName: z.string().min(1),
    modelName: z.string().min(1),
    tags: z.array(z.string()).default([]),
    // A record parser can discard keys such as __proto__. Validate the raw
    // dictionary without changing its keys or field values.
    fields: z.custom<Record<string, string>>(
      value =>
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0 &&
        Object.entries(value).every(
          ([name, field]) => name.length > 0 && typeof field === 'string'
        ),
      'Fields must be a non-empty object with non-empty names and string values'
    ),
  })
  .strict();

export type AnkiNoteRecord = z.infer<typeof AnkiNoteRecordSchema>;

export function serializeAnkiNotes(
  notes: NoteInfo[],
  deckName: string
): string {
  const records: AnkiNoteRecord[] = notes.map(note => ({
    noteId: note.noteId,
    deckName,
    modelName: note.modelName,
    tags: [...note.tags],
    fields: Object.fromEntries(
      Object.entries(note.fields).map(([name, field]) => [name, field.value])
    ),
  }));
  return `${JSON.stringify(records, null, 2)}\n`;
}

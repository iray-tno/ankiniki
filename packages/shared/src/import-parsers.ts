/**
 * Pure parsing functions extracted from import routes for testability.
 * These functions have no side effects and no dependencies on Anki/HTTP.
 */

import { z } from 'zod';
import { ANKI_MODELS } from './constants';
import { AnkiNoteRecordSchema, type AnkiNoteRecord } from './anki-exchange';
import { ValidationError } from './types';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface CsvRow {
  [key: string]: string;
}

export interface ProcessedCard {
  front: string;
  back: string;
  deck: string;
  model: string;
  tags: string[];
  difficulty?: string;
  rowNumber: number;
  success?: boolean;
  error?: string;
  noteId?: number;
  /** Raw Anki fields use the exchange path, without authoring transforms. */
  fields?: Record<string, string>;
  /** Provenance only: never use this ID to update an existing note. */
  sourceNoteId?: number;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export const CsvImportOptionsSchema = z.object({
  delimiter: z.string().optional().default(','),
  defaultDeck: z.string().optional(),
  defaultModel: z.string().optional().default(ANKI_MODELS.BASIC),
  defaultTags: z.array(z.string()).optional().default([]),
  skipHeader: z.boolean().optional().default(true),
  dryRun: z.boolean().optional().default(false),
  columnMapping: z
    .object({
      front: z.string().default('Front'),
      back: z.string().default('Back'),
      deck: z.string().optional().default('Deck'),
      tags: z.string().optional().default('Tags'),
      model: z.string().optional().default('Model'),
      difficulty: z.string().optional().default('Difficulty'),
    })
    .optional()
    .default({}),
});

export function processRows(
  rows: CsvRow[],
  options: z.infer<typeof CsvImportOptionsSchema>
): ProcessedCard[] {
  const { columnMapping, defaultDeck, defaultModel, defaultTags } = options;

  return rows.map((row, index) => {
    const front = row[columnMapping.front] || '';
    const back = row[columnMapping.back] || '';
    const deck = row[columnMapping.deck] || defaultDeck || 'Default';
    const model = row[columnMapping.model] || defaultModel;

    let tags: string[] = [...defaultTags];
    if (row[columnMapping.tags]) {
      const csvTags = row[columnMapping.tags]
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      tags = [...tags, ...csvTags];
    }

    const difficulty = row[columnMapping.difficulty];

    return {
      front: front.trim(),
      back: back.trim(),
      deck: deck.trim(),
      model: model.trim(),
      tags,
      difficulty: difficulty?.trim(),
      rowNumber: index + 1,
    };
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateCards(cards: ProcessedCard[]): {
  valid: ProcessedCard[];
  errors: ProcessedCard[];
} {
  const valid: ProcessedCard[] = [];
  const errors: ProcessedCard[] = [];

  for (const card of cards) {
    if (!card.fields && !card.front) {
      errors.push({
        ...card,
        success: false,
        error: 'Front field is required',
      });
      continue;
    }
    if (!card.fields && !card.back) {
      errors.push({ ...card, success: false, error: 'Back field is required' });
      continue;
    }
    if (!card.deck) {
      errors.push({ ...card, success: false, error: 'Deck name is required' });
      continue;
    }
    valid.push(card);
  }

  return { valid, errors };
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export const JsonImportOptionsSchema = z.object({
  defaultDeck: z.string().optional(),
  defaultModel: z.string().optional().default(ANKI_MODELS.BASIC),
  defaultTags: z.array(z.string()).optional().default([]),
  dryRun: z.boolean().optional().default(false),
  validate: z.boolean().optional().default(true),
  deckOverride: z.string().min(1).optional(),
});

export interface JsonCard {
  front: string;
  back: string;
  deck?: string;
  deckName?: string;
  model?: string;
  tags?: string[];
  difficulty?: string;
  metadata?: Record<string, unknown>;
}

export interface JsonImportFormat {
  cards?: Array<JsonCard | AnkiNoteRecord>;
  deck_name?: string;
  default_tags?: string[];
  default_model?: string;
}

export function processJsonCards(
  data: unknown,
  options: z.infer<typeof JsonImportOptionsSchema>
): ProcessedCard[] {
  let cards: unknown[] = [];
  let defaultDeck = options.defaultDeck;
  let defaultTags = [...options.defaultTags];
  let defaultModel = options.defaultModel;

  if (Array.isArray(data)) {
    cards = data;
  } else if (
    data &&
    typeof data === 'object' &&
    'cards' in data &&
    Array.isArray(data.cards)
  ) {
    const envelope = z
      .object({
        cards: z.array(z.unknown()),
        deck_name: z.string().optional(),
        default_tags: z.array(z.string()).optional(),
        default_model: z.string().optional(),
      })
      .parse(data);
    cards = envelope.cards;
    defaultDeck = envelope.deck_name || defaultDeck;
    defaultTags = [...defaultTags, ...(envelope.default_tags || [])];
    defaultModel = envelope.default_model || defaultModel;
  } else {
    throw new ValidationError(
      'Invalid JSON format. Expected array of cards or object with "cards" property.'
    );
  }

  return cards.map((card, index) => {
    if (!card || typeof card !== 'object') {
      throw new ValidationError(`Invalid card at index ${index}`);
    }
    if ('fields' in card) {
      const note = AnkiNoteRecordSchema.parse(card);
      const values = Object.values(note.fields);
      return {
        front: values[0] ?? '',
        back: values[1] ?? '',
        deck: options.deckOverride ?? note.deckName,
        model: note.modelName,
        tags: [...note.tags, ...defaultTags],
        fields: note.fields,
        sourceNoteId: note.noteId,
        rowNumber: index + 1,
      };
    }
    if (!('front' in card) || !('back' in card) || !card.front || !card.back) {
      throw new ValidationError(
        `Card at index ${index} missing required front or back field`
      );
    }

    const authored = z
      .object({
        front: z.string(),
        back: z.string(),
        deck: z.string().optional(),
        deckName: z.string().optional(),
        model: z.string().optional(),
        tags: z.array(z.string()).optional(),
        difficulty: z.string().optional(),
      })
      .parse(card);
    const allTags = [...defaultTags, ...(authored.tags || [])];

    return {
      front: authored.front.trim(),
      back: authored.back.trim(),
      deck: (
        options.deckOverride ||
        authored.deckName ||
        authored.deck ||
        defaultDeck ||
        'Default'
      ).trim(),
      model: (authored.model || defaultModel).trim(),
      tags: allTags,
      difficulty: authored.difficulty?.trim(),
      rowNumber: index + 1,
    };
  });
}

// ─── Markdown ─────────────────────────────────────────────────────────────────

export const MarkdownImportOptionsSchema = z.object({
  defaultDeck: z.string().optional(),
  defaultModel: z.string().optional().default(ANKI_MODELS.BASIC),
  defaultTags: z.array(z.string()).optional().default([]),
  dryRun: z.boolean().optional().default(false),
});

export function parseFrontmatter(
  block: string
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, value] = match;
    const arrayMatch = value.trim().match(/^\[(.+)\]$/);
    if (arrayMatch) {
      result[key] = arrayMatch[1]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      result[key] = value.trim();
    }
  }
  return result;
}

export function parseMarkdownCards(
  content: string,
  options: z.infer<typeof MarkdownImportOptionsSchema>
): ProcessedCard[] {
  let body = content;
  let deckFromMeta = options.defaultDeck || 'Default';
  let tagsFromMeta: string[] = [...options.defaultTags];
  const model = options.defaultModel;

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    const meta = parseFrontmatter(fmMatch[1]);
    body = fmMatch[2];
    if (typeof meta.deck === 'string') {
      deckFromMeta = meta.deck;
    }
    if (Array.isArray(meta.tags)) {
      tagsFromMeta = [...tagsFromMeta, ...meta.tags];
    } else if (typeof meta.tags === 'string') {
      tagsFromMeta = [...tagsFromMeta, meta.tags];
    }
  }

  const sections = body.split(/\n(?=##\s)/);
  const cards: ProcessedCard[] = [];

  for (const section of sections) {
    const frontMatch = section.match(
      /\*\*Front:\*\*\s*(.+?)(?=\n\*\*Back:|$)/s
    );
    const backMatch = section.match(/\*\*Back:\*\*\s*([\s\S]+?)(?=\n##|$)/);
    if (!frontMatch || !backMatch) {
      continue;
    }

    const front = frontMatch[1].trim();
    const back = backMatch[1].trim();
    if (!front || !back) {
      continue;
    }

    cards.push({
      front,
      back,
      deck: deckFromMeta,
      model,
      tags: [...tagsFromMeta],
      rowNumber: cards.length + 1,
    });
  }

  return cards;
}

// ─── Shared card creation helpers ─────────────────────────────────────────────

export type ImportSource = 'csv' | 'json' | 'markdown' | 'json-body';

/**
 * Map front/back content to AnkiConnect fields based on note model.
 * Basic and unknown models use Front/Back fields; Cloze uses Text.
 */
export function mapCardFields(
  front: string,
  back: string,
  model: string
): Record<string, string> {
  const f = front.replace(/\n/g, '<br>');
  const b = back.replace(/\n/g, '<br>');
  if (model === ANKI_MODELS.CLOZE) {
    return { Text: `${f}<br><br>${b}` };
  }
  return { Front: f, Back: b };
}

/**
 * Build the full tag list for an imported card.
 * Combines card tags, a source tag, a dated import tag, and an optional difficulty tag.
 */
export function buildImportTags(
  cardTags: string[],
  source: ImportSource,
  difficulty?: string
): string[] {
  const tags = [
    ...cardTags,
    `${source}-import`,
    `imported-${new Date().toISOString().split('T')[0]}`,
  ];
  if (difficulty) {
    tags.push(`difficulty-${difficulty}`);
  }
  return tags;
}

import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  parseMarkdownCards,
  processRows,
  validateCards,
  processJsonCards,
  CsvImportOptionsSchema,
  JsonImportOptionsSchema,
  MarkdownImportOptionsSchema,
} from '../lib/import-parsers';

// ─── parseFrontmatter ─────────────────────────────────────────────────────────

describe('parseFrontmatter', () => {
  it('parses string values', () => {
    const result = parseFrontmatter('deck: My Deck\nmodel: Basic');
    expect(result.deck).toBe('My Deck');
    expect(result.model).toBe('Basic');
  });

  it('parses array values', () => {
    const result = parseFrontmatter('tags: [tag1, tag2, tag3]');
    expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('strips quotes from array elements', () => {
    const result = parseFrontmatter('tags: [\'foo\', "bar"]');
    expect(result.tags).toEqual(['foo', 'bar']);
  });

  it('returns empty object for empty input', () => {
    expect(parseFrontmatter('')).toEqual({});
  });

  it('ignores malformed lines', () => {
    const result = parseFrontmatter('not-valid\ndeck: OK');
    expect(result.deck).toBe('OK');
    expect(Object.keys(result)).toHaveLength(1);
  });
});

// ─── parseMarkdownCards ───────────────────────────────────────────────────────

const defaultMdOptions = MarkdownImportOptionsSchema.parse({});

describe('parseMarkdownCards', () => {
  it('parses a single card without frontmatter', () => {
    const content = '## Card 1\n**Front:** What is 2+2?\n**Back:** 4';
    const cards = parseMarkdownCards(content, defaultMdOptions);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('What is 2+2?');
    expect(cards[0].back).toBe('4');
    expect(cards[0].deck).toBe('Default');
    expect(cards[0].model).toBe('Basic');
  });

  it('parses frontmatter for deck and tags', () => {
    const content =
      '---\ndeck: Science\ntags: [bio, chemistry]\n---\n## Q1\n**Front:** Cell?\n**Back:** Basic unit';
    const cards = parseMarkdownCards(content, defaultMdOptions);
    expect(cards[0].deck).toBe('Science');
    expect(cards[0].tags).toContain('bio');
    expect(cards[0].tags).toContain('chemistry');
  });

  it('parses multiple cards from sections', () => {
    const content =
      '## Q1\n**Front:** Q1\n**Back:** A1\n## Q2\n**Front:** Q2\n**Back:** A2';
    const cards = parseMarkdownCards(content, defaultMdOptions);
    expect(cards).toHaveLength(2);
    expect(cards[0].front).toBe('Q1');
    expect(cards[1].front).toBe('Q2');
    expect(cards[0].rowNumber).toBe(1);
    expect(cards[1].rowNumber).toBe(2);
  });

  it('skips sections without Front/Back markers', () => {
    const content =
      '## Header only\nSome random text\n## Q2\n**Front:** Q\n**Back:** A';
    const cards = parseMarkdownCards(content, defaultMdOptions);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('Q');
  });

  it('uses defaultDeck from options when no frontmatter', () => {
    const opts = MarkdownImportOptionsSchema.parse({
      defaultDeck: 'CustomDeck',
    });
    const content = '## Q\n**Front:** Q\n**Back:** A';
    const cards = parseMarkdownCards(content, opts);
    expect(cards[0].deck).toBe('CustomDeck');
  });

  it('merges defaultTags with frontmatter tags', () => {
    const opts = MarkdownImportOptionsSchema.parse({ defaultTags: ['global'] });
    const content = '---\ntags: [local]\n---\n## Q\n**Front:** Q\n**Back:** A';
    const cards = parseMarkdownCards(content, opts);
    expect(cards[0].tags).toContain('global');
    expect(cards[0].tags).toContain('local');
  });
});

// ─── processRows ─────────────────────────────────────────────────────────────

const defaultCsvOptions = CsvImportOptionsSchema.parse({});

describe('processRows', () => {
  it('maps CSV row columns to card fields', () => {
    const rows = [{ Front: 'Q', Back: 'A', Deck: 'Math' }];
    const cards = processRows(rows, defaultCsvOptions);
    expect(cards[0].front).toBe('Q');
    expect(cards[0].back).toBe('A');
    expect(cards[0].deck).toBe('Math');
    expect(cards[0].rowNumber).toBe(1);
  });

  it('falls back to defaultDeck when Deck column is missing', () => {
    const opts = CsvImportOptionsSchema.parse({ defaultDeck: 'FallbackDeck' });
    const rows = [{ Front: 'Q', Back: 'A' }];
    const cards = processRows(rows, opts);
    expect(cards[0].deck).toBe('FallbackDeck');
  });

  it('uses Default deck when no deck anywhere', () => {
    const rows = [{ Front: 'Q', Back: 'A' }];
    const cards = processRows(rows, defaultCsvOptions);
    expect(cards[0].deck).toBe('Default');
  });

  it('splits comma-separated tags', () => {
    const rows = [{ Front: 'Q', Back: 'A', Tags: 'math, science' }];
    const cards = processRows(rows, defaultCsvOptions);
    expect(cards[0].tags).toContain('math');
    expect(cards[0].tags).toContain('science');
  });

  it('trims whitespace from fields', () => {
    const rows = [{ Front: '  Q  ', Back: '  A  ' }];
    const cards = processRows(rows, defaultCsvOptions);
    expect(cards[0].front).toBe('Q');
    expect(cards[0].back).toBe('A');
  });

  it('assigns sequential rowNumbers', () => {
    const rows = [
      { Front: 'Q1', Back: 'A1' },
      { Front: 'Q2', Back: 'A2' },
    ];
    const cards = processRows(rows, defaultCsvOptions);
    expect(cards[0].rowNumber).toBe(1);
    expect(cards[1].rowNumber).toBe(2);
  });
});

// ─── validateCards ────────────────────────────────────────────────────────────

describe('validateCards', () => {
  const card = {
    front: 'Q',
    back: 'A',
    deck: 'D',
    model: 'Basic',
    tags: [],
    rowNumber: 1,
  };

  it('puts valid cards in valid array', () => {
    const { valid, errors } = validateCards([card]);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  it('rejects card with empty front', () => {
    const { valid, errors } = validateCards([{ ...card, front: '' }]);
    expect(valid).toHaveLength(0);
    expect(errors[0].error).toBe('Front field is required');
  });

  it('rejects card with empty back', () => {
    const { valid, errors } = validateCards([{ ...card, back: '' }]);
    expect(valid).toHaveLength(0);
    expect(errors[0].error).toBe('Back field is required');
  });

  it('rejects card with empty deck', () => {
    const { valid, errors } = validateCards([{ ...card, deck: '' }]);
    expect(valid).toHaveLength(0);
    expect(errors[0].error).toBe('Deck name is required');
  });

  it('handles mixed valid/invalid cards', () => {
    const invalid = { ...card, front: '' };
    const { valid, errors } = validateCards([card, invalid]);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(1);
  });
});

// ─── processJsonCards ─────────────────────────────────────────────────────────

const defaultJsonOptions = JsonImportOptionsSchema.parse({});

describe('processJsonCards', () => {
  it('processes array format', () => {
    const data = [{ front: 'Q', back: 'A' }];
    const cards = processJsonCards(data, defaultJsonOptions);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('Q');
    expect(cards[0].deck).toBe('Default');
  });

  it('processes object format with cards property', () => {
    const data = {
      cards: [{ front: 'Q', back: 'A' }],
      deck_name: 'MyDeck',
      default_tags: ['auto'],
    };
    const cards = processJsonCards(data, defaultJsonOptions);
    expect(cards[0].deck).toBe('MyDeck');
    expect(cards[0].tags).toContain('auto');
  });

  it('uses card-level deck over default', () => {
    const data = [{ front: 'Q', back: 'A', deck: 'CardDeck' }];
    const opts = JsonImportOptionsSchema.parse({ defaultDeck: 'DefaultDeck' });
    const cards = processJsonCards(data, opts);
    expect(cards[0].deck).toBe('CardDeck');
  });

  it('merges card tags with default tags', () => {
    const opts = JsonImportOptionsSchema.parse({
      defaultTags: ['default-tag'],
    });
    const data = [{ front: 'Q', back: 'A', tags: ['card-tag'] }];
    const cards = processJsonCards(data, opts);
    expect(cards[0].tags).toContain('default-tag');
    expect(cards[0].tags).toContain('card-tag');
  });

  it('throws for invalid format', () => {
    expect(() => processJsonCards({} as any, defaultJsonOptions)).toThrow(
      'Invalid JSON format'
    );
  });

  it('throws when card is missing front or back', () => {
    expect(() =>
      processJsonCards([{ front: 'Q' } as any], defaultJsonOptions)
    ).toThrow('missing required front or back field');
  });

  it('assigns sequential rowNumbers', () => {
    const data = [
      { front: 'Q1', back: 'A1' },
      { front: 'Q2', back: 'A2' },
    ];
    const cards = processJsonCards(data, defaultJsonOptions);
    expect(cards[0].rowNumber).toBe(1);
    expect(cards[1].rowNumber).toBe(2);
  });
});

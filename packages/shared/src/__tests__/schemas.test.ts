import { describe, it, expect } from 'vitest';
import {
  CardSchema,
  DeckSchema,
  ConfigSchema,
  AnkinikiError,
  AnkiConnectError,
  ValidationError,
} from '../types';

describe('CardSchema', () => {
  const base = {
    id: 'abc',
    deckId: 'deck1',
    front: 'What is 2+2?',
    back: '4',
    created: new Date(),
    modified: new Date(),
  };

  it('parses a valid card', () => {
    const result = CardSchema.parse(base);
    expect(result.front).toBe('What is 2+2?');
    expect(result.tags).toEqual([]);
    expect(result.reps).toBe(0);
  });

  it('accepts optional fields', () => {
    const result = CardSchema.parse({
      ...base,
      tags: ['math'],
      interval: 5,
      ease: 2.5,
    });
    expect(result.tags).toEqual(['math']);
    expect(result.interval).toBe(5);
  });

  it('fails when required fields are missing', () => {
    expect(() => CardSchema.parse({ id: 'x' })).toThrow();
  });
});

describe('DeckSchema', () => {
  const base = {
    id: 'd1',
    name: 'Math',
    created: new Date(),
    modified: new Date(),
  };

  it('parses a valid deck', () => {
    const result = DeckSchema.parse(base);
    expect(result.name).toBe('Math');
    expect(result.cardCount).toBe(0);
  });

  it('accepts config', () => {
    const result = DeckSchema.parse({
      ...base,
      config: { newCardsPerDay: 10, reviewCardsPerDay: 100 },
    });
    expect(result.config?.newCardsPerDay).toBe(10);
  });

  it('fails when required fields are missing', () => {
    expect(() => DeckSchema.parse({ id: 'd1' })).toThrow();
  });
});

describe('ConfigSchema', () => {
  it('uses defaults when no values provided', () => {
    const config = ConfigSchema.parse({});
    expect(config.ankiConnectUrl).toBe('http://localhost:8765');
    expect(config.ankiConnectTimeout).toBe(5000);
    expect(config.autoSync).toBe(true);
    expect(config.theme).toBe('system');
  });

  it('accepts valid theme values', () => {
    expect(ConfigSchema.parse({ theme: 'dark' }).theme).toBe('dark');
    expect(ConfigSchema.parse({ theme: 'light' }).theme).toBe('light');
  });

  it('rejects invalid theme', () => {
    expect(() => ConfigSchema.parse({ theme: 'blue' })).toThrow();
  });
});

describe('Error classes', () => {
  it('AnkinikiError has correct properties', () => {
    const err = new AnkinikiError('test', 'TEST_CODE', 400);
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_CODE');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('AnkinikiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('AnkiConnectError has correct properties', () => {
    const err = new AnkiConnectError('connection failed');
    expect(err.code).toBe('ANKI_CONNECT_ERROR');
    expect(err.statusCode).toBe(502);
    expect(err.name).toBe('AnkiConnectError');
    expect(err).toBeInstanceOf(AnkinikiError);
  });

  it('ValidationError has correct properties', () => {
    const err = new ValidationError('invalid input');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('ValidationError');
    expect(err).toBeInstanceOf(AnkinikiError);
  });
});

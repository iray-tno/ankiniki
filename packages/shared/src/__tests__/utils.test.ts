import { describe, it, expect, vi } from 'vitest';
import {
  generateId,
  formatDate,
  parseDate,
  sanitizeCardContent,
  extractCodeFromMarkdown,
  isValidDeckName,
  isValidCardContent,
  shuffleArray,
  retry,
} from '../utils';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2024-01-15T12:00:00Z'))).toBe('2024-01-15');
  });
});

describe('parseDate', () => {
  it('parses a valid date string', () => {
    const d = parseDate('2024-01-15');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2024);
  });

  it('throws AnkinikiError for invalid date', () => {
    expect(() => parseDate('not-a-date')).toThrow('Invalid date format');
  });
});

describe('sanitizeCardContent', () => {
  it('removes script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    expect(sanitizeCardContent(input)).toBe('Hello  World');
  });

  it('removes javascript: links', () => {
    const input = 'Click javascript:void(0) here';
    expect(sanitizeCardContent(input)).toBe('Click void(0) here');
  });

  it('trims whitespace', () => {
    expect(sanitizeCardContent('  hello  ')).toBe('hello');
  });

  it('leaves safe content unchanged', () => {
    expect(sanitizeCardContent('What is 2 + 2?')).toBe('What is 2 + 2?');
  });
});

describe('extractCodeFromMarkdown', () => {
  it('extracts code blocks', () => {
    const md = 'Text\n```js\nconsole.log("hi");\n```\nMore text';
    const blocks = extractCodeFromMarkdown(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain('console.log');
  });

  it('returns empty array when no code blocks', () => {
    expect(extractCodeFromMarkdown('No code here')).toEqual([]);
  });

  it('handles multiple code blocks', () => {
    const md = '```\nfoo\n```\n```\nbar\n```';
    expect(extractCodeFromMarkdown(md)).toHaveLength(2);
  });
});

describe('isValidDeckName', () => {
  it('accepts alphanumeric names', () => {
    expect(isValidDeckName('MyDeck123')).toBe(true);
  });

  it('accepts names with spaces, hyphens, underscores', () => {
    expect(isValidDeckName('My Deck-1_2')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidDeckName('')).toBe(false);
  });

  it('rejects names longer than 100 characters', () => {
    expect(isValidDeckName('a'.repeat(101))).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isValidDeckName('Deck!')).toBe(false);
    expect(isValidDeckName('Deck/Sub')).toBe(false);
  });
});

describe('isValidCardContent', () => {
  it('accepts non-empty content within limit', () => {
    expect(isValidCardContent('What is 2+2?')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidCardContent('')).toBe(false);
  });

  it('rejects content over 10000 characters', () => {
    expect(isValidCardContent('a'.repeat(10001))).toBe(false);
  });

  it('accepts content of exactly 10000 characters', () => {
    expect(isValidCardContent('a'.repeat(10000))).toBe(true);
  });
});

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(arr.length);
  });

  it('contains the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr).sort()).toEqual([...arr].sort());
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    shuffleArray(arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('retry', () => {
  it('resolves on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retry(fn, 3, 0)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and resolves eventually', async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('fail'));
      }
      return Promise.resolve('done');
    });
    await expect(retry(fn, 3, 0)).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, 3, 0)).rejects.toThrow('Failed after 3 attempts');
  });
});

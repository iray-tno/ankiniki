import { describe, it, expect, vi } from 'vitest';
import { generateId, sanitizeCardContent, shuffleArray, retry } from '../utils';

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

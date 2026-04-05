import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { bundleFile } from '../commands/bundle';
import AnkiExport from 'anki-apkg-export';

// Mock dependencies
vi.mock('fs');
vi.mock('anki-apkg-export');
vi.mock('@ankiniki/backend/src/lib/import-parsers', async () => {
  const actual = await vi.importActual(
    '@ankiniki/backend/src/lib/import-parsers'
  );
  return {
    ...actual,
  };
});

describe('bundleFile', () => {
  const mockFilePath = 'test.json';
  const mockContent = JSON.stringify([
    { front: 'Front 1', back: 'Back 1', deck: 'TestDeck' },
    { front: 'Front 2', back: 'Back 2', deck: 'TestDeck' },
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(path, 'resolve').mockImplementation(p => p);
    vi.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
    vi.spyOn(path, 'extname').mockReturnValue('.json');
    vi.spyOn(path, 'basename').mockReturnValue('test');

    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(mockContent);
    (fs.writeFileSync as any).mockReturnValue(undefined);
  });

  it('successfully bundles cards from JSON', async () => {
    const mockSave = vi.fn().mockResolvedValue(Buffer.from('zip-content'));
    const mockAddCard = vi.fn();

    vi.mocked(AnkiExport).mockImplementation(function (this: any) {
      this.addCard = mockAddCard;
      this.save = mockSave;
      return this;
    } as any);

    const result = await bundleFile(mockFilePath, 'output.apkg', {});

    expect(result.cardCount).toBe(2);
    expect(result.outputPath).toBe('output.apkg');
    expect(mockAddCard).toHaveBeenCalledTimes(2);
    expect(mockSave).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'output.apkg',
      expect.anything(),
      'binary'
    );
  });

  it('throws error if file does not exist', async () => {
    (fs.existsSync as any).mockReturnValue(false);

    await expect(bundleFile('missing.json', undefined, {})).rejects.toThrow(
      'File not found'
    );
  });

  it('throws error if no valid cards found', async () => {
    (fs.readFileSync as any).mockReturnValue('[]'); // Empty array

    await expect(bundleFile(mockFilePath, undefined, {})).rejects.toThrow(
      'No valid cards found to bundle'
    );
  });

  it('overrides deck name if provided', async () => {
    const mockAddCard = vi.fn();
    const mockSave = vi.fn().mockResolvedValue(Buffer.from('zip'));

    vi.mocked(AnkiExport).mockImplementation(function (this: any) {
      this.addCard = mockAddCard;
      this.save = mockSave;
      return this;
    } as any);

    await bundleFile(mockFilePath, undefined, { deck: 'OverriddenDeck' });

    expect(AnkiExport).toHaveBeenCalledWith('OverriddenDeck');
  });
});

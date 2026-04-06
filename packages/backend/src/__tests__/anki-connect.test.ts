import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ankiConnect } from '../services/ankiConnect';

describe('AnkiConnectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDeckExists', () => {
    it('returns true immediately if deck is in the set', async () => {
      const existingDecks = new Set(['Default', 'Japanese']);
      const createSpy = vi.spyOn(ankiConnect, 'createDeck');

      const result = await ankiConnect.ensureDeckExists(
        'Japanese',
        existingDecks
      );

      expect(result).toBe(true);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('creates deck and returns true if deck is missing', async () => {
      const existingDecks = new Set(['Default']);
      const createSpy = vi
        .spyOn(ankiConnect, 'createDeck')
        .mockResolvedValue(123);

      const result = await ankiConnect.ensureDeckExists(
        'NewDeck',
        existingDecks
      );

      expect(result).toBe(true);
      expect(createSpy).toHaveBeenCalledWith('NewDeck');
      expect(existingDecks.has('NewDeck')).toBe(true);
    });

    it('returns false and logs error if creation fails', async () => {
      const existingDecks = new Set(['Default']);
      vi.spyOn(ankiConnect, 'createDeck').mockRejectedValue(
        new Error('API Error')
      );

      const result = await ankiConnect.ensureDeckExists(
        'FailDeck',
        existingDecks
      );

      expect(result).toBe(false);
      expect(existingDecks.has('FailDeck')).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { ankiConnect } from '../services/ankiConnect';

vi.mock('../services/ankiConnect', () => ({
  ankiConnect: {
    ping: vi.fn(),
    getDeckNames: vi.fn(),
    createDeck: vi.fn(),
    deleteDeck: vi.fn(),
    addNote: vi.fn(),
    updateNoteFields: vi.fn(),
    deleteNotes: vi.fn(),
    findNotes: vi.fn(),
    notesInfo: vi.fn(),
    modelNames: vi.fn(),
    ensureDeckExists: vi.fn(),
  },
}));

const app = createApp();

describe('Decks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/decks', () => {
    it('returns all deck names', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue([
        'Default',
        'Spanish',
        'Programming',
      ]);

      const res = await request(app).get('/api/decks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(['Default', 'Spanish', 'Programming']);
    });

    it('propagates AnkiConnect errors as 500', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockRejectedValue(
        new Error('AnkiConnect unavailable')
      );

      const res = await request(app).get('/api/decks');

      expect(res.status).toBe(500);
      expect(res.type).toMatch(/problem\+json/);
    });
  });

  describe('POST /api/decks', () => {
    it('creates a deck and returns 201 with the new id', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(['Default']); // assertDeckNotExists check
      vi.mocked(ankiConnect.createDeck).mockResolvedValue(42);

      const res = await request(app)
        .post('/api/decks')
        .send({ name: 'NewDeck' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(42);
      expect(ankiConnect.createDeck).toHaveBeenCalledWith('NewDeck');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app).post('/api/decks').send({});

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
      expect(res.body.type).toBe('/problems/validation-error');
    });

    it('returns 400 when deck already exists', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue([
        'Default',
        'ExistingDeck',
      ]);

      const res = await request(app)
        .post('/api/decks')
        .send({ name: 'ExistingDeck' });

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
    });
  });

  describe('DELETE /api/decks/:name', () => {
    it('deletes a deck and returns 200', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue([
        'Default',
        'ToDelete',
      ]);
      vi.mocked(ankiConnect.deleteDeck).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/decks/ToDelete')
        .send({ deleteCards: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(ankiConnect.deleteDeck).toHaveBeenCalledWith('ToDelete', true);
    });

    it('returns 400 when deck does not exist', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(['Default']);

      const res = await request(app)
        .delete('/api/decks/NonExistent')
        .send({ deleteCards: false });

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
      expect(ankiConnect.deleteDeck).not.toHaveBeenCalled();
    });

    it('defaults deleteCards to false when not provided', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue([
        'Default',
        'ToDrop',
      ]);
      vi.mocked(ankiConnect.deleteDeck).mockResolvedValue(undefined);

      await request(app).delete('/api/decks/ToDrop').send({});

      expect(ankiConnect.deleteDeck).toHaveBeenCalledWith('ToDrop', false);
    });
  });
});

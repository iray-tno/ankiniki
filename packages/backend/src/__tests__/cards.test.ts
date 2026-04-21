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

// generateCards used by POST /api/cards/generate-and-create
vi.mock('../services/mlService', () => ({
  default: {
    generateCards: vi.fn(),
    enhanceQuestion: vi.fn(),
    getAvailability: vi.fn().mockReturnValue(true),
  },
}));

const app = createApp();

describe('Cards API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/cards', () => {
    it('creates a note and returns 201 with noteId', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(['Default']);
      vi.mocked(ankiConnect.modelNames).mockResolvedValue(['Basic']);
      vi.mocked(ankiConnect.addNote).mockResolvedValue(12345);

      const res = await request(app)
        .post('/api/cards')
        .send({
          deckName: 'Default',
          modelName: 'Basic',
          fields: {
            Front: 'What is TypeScript?',
            Back: 'A typed superset of JS',
          },
          tags: ['typescript'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.noteId).toBe(12345);
      expect(ankiConnect.addNote).toHaveBeenCalledWith(
        'Default',
        'Basic',
        { Front: 'What is TypeScript?', Back: 'A typed superset of JS' },
        ['typescript']
      );
    });

    it('uses Basic model as default when modelName is omitted', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(['Default']);
      vi.mocked(ankiConnect.modelNames).mockResolvedValue(['Basic']);
      vi.mocked(ankiConnect.addNote).mockResolvedValue(99);

      const res = await request(app)
        .post('/api/cards')
        .send({
          deckName: 'Default',
          fields: { Front: 'Q', Back: 'A' },
        });

      expect(res.status).toBe(201);
      expect(ankiConnect.addNote).toHaveBeenCalledWith(
        'Default',
        'Basic',
        expect.any(Object),
        []
      );
    });

    it('returns 400 when deckName is missing', async () => {
      const res = await request(app)
        .post('/api/cards')
        .send({
          fields: { Front: 'Q', Back: 'A' },
        });

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
      expect(res.body.type).toBe('/problems/validation-error');
    });

    it('returns 400 when deck does not exist in Anki', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(['Other']);
      vi.mocked(ankiConnect.modelNames).mockResolvedValue(['Basic']);

      const res = await request(app)
        .post('/api/cards')
        .send({
          deckName: 'NonExistent',
          fields: { Front: 'Q', Back: 'A' },
        });

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
      expect(ankiConnect.addNote).not.toHaveBeenCalled();
    });

    it('returns 400 when model does not exist in Anki', async () => {
      vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(['Default']);
      vi.mocked(ankiConnect.modelNames).mockResolvedValue(['Cloze']); // Basic not available

      const res = await request(app)
        .post('/api/cards')
        .send({
          deckName: 'Default',
          modelName: 'Basic',
          fields: { Front: 'Q', Back: 'A' },
        });

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
      expect(ankiConnect.addNote).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/cards', () => {
    it('updates note fields and returns 200', async () => {
      vi.mocked(ankiConnect.updateNoteFields).mockResolvedValue(undefined);

      const res = await request(app)
        .put('/api/cards')
        .send({
          noteId: 12345,
          fields: { Front: 'Updated question' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(ankiConnect.updateNoteFields).toHaveBeenCalledWith(12345, {
        Front: 'Updated question',
      });
    });

    it('returns 400 when noteId is missing', async () => {
      const res = await request(app)
        .put('/api/cards')
        .send({
          fields: { Front: 'Q' },
        });

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
    });
  });

  describe('DELETE /api/cards', () => {
    it('deletes notes and returns 200', async () => {
      vi.mocked(ankiConnect.deleteNotes).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/cards')
        .send({ noteIds: [1, 2, 3] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(ankiConnect.deleteNotes).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('returns 400 when noteIds is missing', async () => {
      const res = await request(app).delete('/api/cards').send({});

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
    });
  });

  describe('GET /api/cards/search', () => {
    it('returns matching notes for a query', async () => {
      const mockNotes = [
        {
          noteId: 1,
          fields: {
            Front: { value: 'Q', order: 0 },
            Back: { value: 'A', order: 1 },
          },
          tags: [],
        },
      ];
      vi.mocked(ankiConnect.findNotes).mockResolvedValue([1]);
      vi.mocked(ankiConnect.notesInfo).mockResolvedValue(mockNotes);

      const res = await request(app)
        .get('/api/cards/search')
        .query({ q: 'deck:Default' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockNotes);
      expect(ankiConnect.findNotes).toHaveBeenCalledWith('deck:Default');
    });

    it('returns 400 when query param is missing', async () => {
      const res = await request(app).get('/api/cards/search');

      expect(res.status).toBe(400);
      expect(res.type).toMatch(/problem\+json/);
    });
  });
});

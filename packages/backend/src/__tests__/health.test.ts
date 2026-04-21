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

describe('GET /health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with healthy status when AnkiConnect is reachable', async () => {
    vi.mocked(ankiConnect.ping).mockResolvedValue(true);

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.ankiConnect.connected).toBe(true);
  });

  it('returns 503 problem+json when AnkiConnect is unreachable', async () => {
    vi.mocked(ankiConnect.ping).mockResolvedValue(false);

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.type).toMatch(/problem\+json/);
    expect(res.body.status).toBe(503);
    expect(res.body.type).toBe('/problems/anki-connect-unavailable');
  });
});

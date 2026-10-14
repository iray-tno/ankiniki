import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { ankiConnect } from '../services/ankiConnect';
import { AnkiConnectError, AnkiNoteRecordSchema } from '@ankiniki/shared';

vi.mock('../services/mlService', () => ({ default: {} }));
vi.mock('../services/ankiConnect', () => ({
  ankiConnect: {
    getDeckNames: vi.fn(),
    modelNames: vi.fn(),
    modelFieldNames: vi.fn(),
    ensureDeckExists: vi.fn(),
    addNote: vi.fn(),
    updateNoteFields: vi.fn(),
  },
}));

const records = JSON.parse(
  readFileSync(
    new URL('../../../../docs/examples/json/anki-notes.json', import.meta.url),
    'utf8'
  )
).map((record: unknown) => AnkiNoteRecordSchema.parse(record));
const app = createApp();

function importFile(path: string, cards: unknown, options = {}) {
  return request(app)
    .post(path)
    .field('options', JSON.stringify(options))
    .attach('file', Buffer.from(JSON.stringify(cards)), 'notes.json');
}

describe('JSON note-content import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ankiConnect.getDeckNames).mockResolvedValue(
      records.map(record => record.deckName)
    );
    vi.mocked(ankiConnect.modelNames).mockResolvedValue(
      records.map(record => record.modelName)
    );
    vi.mocked(ankiConnect.modelFieldNames).mockImplementation(async model =>
      Object.keys(records.find(record => record.modelName === model)!.fields)
    );
    vi.mocked(ankiConnect.ensureDeckExists).mockResolvedValue(true);
    vi.mocked(ankiConnect.addNote).mockResolvedValue(999);
  });

  it.each(['file', 'body'])(
    'imports exported records through the %s endpoint without transformations',
    async kind => {
      const response =
        kind === 'file'
          ? await importFile('/api/import/json', records)
          : await request(app)
              .post('/api/import/json/body')
              .send({ cards: records });
      expect(response.status).toBe(200);
      expect(response.body.data.successfulCards).toBe(3);
      records.forEach((note, index) => {
        expect(ankiConnect.addNote).toHaveBeenNthCalledWith(
          index + 1,
          note.deckName,
          note.modelName,
          note.fields,
          note.tags
        );
      });
      expect(ankiConnect.updateNoteFields).not.toHaveBeenCalled();
      expect(response.body.data.results[0].sourceNoteId).toBe(
        records[0].noteId
      );
      expect(response.body.data.results[0].noteId).toBe(999);
    }
  );

  it.each(['file', 'body', 'preview'])(
    'checks native model compatibility in %s dry-run without writing',
    async kind => {
      const response =
        kind === 'body'
          ? await request(app)
              .post('/api/import/json/body')
              .send({ cards: records, options: { dryRun: true } })
          : await importFile(
              kind === 'preview'
                ? '/api/import/json/preview'
                : '/api/import/json',
              records,
              { dryRun: kind !== 'preview' }
            );
      expect(response.status).toBe(200);
      expect(response.body.data.validCards).toBe(3);
      expect(ankiConnect.modelFieldNames).toHaveBeenCalledTimes(3);
      expect(ankiConnect.addNote).not.toHaveBeenCalled();
      expect(ankiConnect.ensureDeckExists).not.toHaveBeenCalled();
      const samples =
        response.body.data.sampleCards ?? response.body.data.preview;
      expect(samples[2].fields).toEqual(records[2].fields);
    }
  );

  it('reports unsupported models without creating a deck or writing a note', async () => {
    vi.mocked(ankiConnect.modelNames).mockResolvedValue([]);
    const response = await request(app)
      .post('/api/import/json/body')
      .send({ cards: [records[2]] });
    expect(response.status).toBe(200);
    expect(response.body.data.failedCards).toBe(1);
    expect(response.body.data.results[0].error).toContain('does not exist');
    expect(ankiConnect.addNote).not.toHaveBeenCalled();
    expect(ankiConnect.ensureDeckExists).not.toHaveBeenCalled();
  });

  it.each([{ Front: 'Q' }, { Front: 'Q', Back: 'A', Extra: 'unexpected' }])(
    'rejects model field mismatch %j before writing',
    async fields => {
      const response = await importFile('/api/import/json', [
        { ...records[0], fields },
      ]);
      expect(response.body.data.failedCards).toBe(1);
      expect(response.body.data.results[0].error).toContain(
        'Fields do not match'
      );
      expect(ankiConnect.addNote).not.toHaveBeenCalled();
      expect(ankiConnect.ensureDeckExists).not.toHaveBeenCalled();
    }
  );

  it('checks a shared model only once during preview', async () => {
    const response = await importFile('/api/import/json/preview', [
      records[0],
      records[0],
    ]);
    expect(response.body.data.validCards).toBe(2);
    expect(ankiConnect.modelFieldNames).toHaveBeenCalledTimes(1);
  });

  it.each([
    '/api/import/json',
    '/api/import/json/preview',
    '/api/import/json/body',
  ])('returns 400 for invalid raw fields at %s', async path => {
    const cards = [{ ...records[0], fields: { Front: 42 } }];
    const response = path.endsWith('/body')
      ? await request(app).post(path).send({ cards })
      : await importFile(path, cards);
    expect(response.status).toBe(400);
    expect(response.type).toMatch(/problem\+json/);
    expect(ankiConnect.addNote).not.toHaveBeenCalled();
  });

  it('does not write if model compatibility cannot be read', async () => {
    vi.mocked(ankiConnect.modelFieldNames).mockRejectedValueOnce(
      new AnkiConnectError('connection lost')
    );
    const response = await request(app)
      .post('/api/import/json/body')
      .send({ cards: [records[0]] });
    expect(response.status).toBe(500);
    expect(ankiConnect.addNote).not.toHaveBeenCalled();
  });

  it('retains legacy authoring transformations in a mixed batch', async () => {
    const response = await request(app)
      .post('/api/import/json/body')
      .send({ cards: [records[0], { front: ' Q\nQ ', back: ' A\nA ' }] });
    expect(response.body.data.successfulCards).toBe(2);
    expect(ankiConnect.addNote).toHaveBeenNthCalledWith(
      1,
      records[0].deckName,
      'Basic',
      records[0].fields,
      records[0].tags
    );
    expect(ankiConnect.addNote).toHaveBeenNthCalledWith(
      2,
      'Default',
      'Basic',
      { Front: 'Q<br>Q', Back: 'A<br>A' },
      expect.arrayContaining(['json-body-import'])
    );
  });
});

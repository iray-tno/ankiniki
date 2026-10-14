import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { AnkiNoteRecordSchema, serializeAnkiNotes } from '../anki-exchange';
import {
  processJsonCards,
  JsonImportOptionsSchema,
  validateCards,
} from '../import-parsers';
import type { NoteInfo } from '../anki-client';

const records = JSON.parse(
  readFileSync(
    new URL('../../../../docs/examples/json/anki-notes.json', import.meta.url),
    'utf8'
  )
);
const options = JsonImportOptionsSchema.parse({});

describe('Anki note-content exchange', () => {
  it('rejects unsupported top-level data rather than silently dropping it', () => {
    expect(() =>
      processJsonCards([{ ...records[0], scheduling: { due: 123 } }], options)
    ).toThrow();
  });
  it('preserves custom fields, HTML, whitespace, Cloze, empty values and tags', () => {
    const imported = processJsonCards(records, options);
    records.forEach((record: unknown, index: number) => {
      const note = AnkiNoteRecordSchema.parse(record);
      expect(imported[index].fields).toEqual(note.fields);
      expect(imported[index].tags).toEqual(note.tags);
      expect(imported[index].model).toBe(note.modelName);
      expect(imported[index].deck).toBe(note.deckName);
      expect(imported[index].sourceNoteId).toBe(note.noteId);
      expect(imported[index].noteId).toBeUndefined();
    });
    expect(validateCards(imported).errors).toEqual([]);
  });

  it('round-trips actual Anki note info through the export serializer', () => {
    const source = AnkiNoteRecordSchema.parse(records[2]);
    const note: NoteInfo = {
      noteId: source.noteId!,
      modelName: source.modelName,
      tags: source.tags,
      cards: [1700000000999],
      fields: Object.fromEntries(
        Object.entries(source.fields).map(([name, value], order) => [
          name,
          { value, order },
        ])
      ),
    };
    const imported = processJsonCards(
      JSON.parse(serializeAnkiNotes([note], source.deckName)),
      options
    );
    expect(imported[0].fields).toEqual(source.fields);
    expect(imported[0].tags).toEqual(source.tags);
    expect(imported[0].model).toBe(source.modelName);
  });

  it('changes only the explicitly overridden deck and additional tags', () => {
    const imported = processJsonCards(
      records,
      JsonImportOptionsSchema.parse({
        deckOverride: 'Copy',
        defaultTags: ['explicit'],
      })
    );
    expect(imported[0].deck).toBe('Copy');
    expect(imported[0].fields).toEqual(records[0].fields);
    expect(imported[0].tags).toEqual([...records[0].tags, 'explicit']);
    expect(imported[0].model).toBe(records[0].modelName);
  });

  it('keeps authoring and exchange records distinct in a mixed array', () => {
    const imported = processJsonCards(
      [records[0], { front: ' Q\n ', back: ' A ' }],
      options
    );
    expect(imported[0].fields).toEqual(records[0].fields);
    expect(imported[1].fields).toBeUndefined();
    expect(imported[1].front).toBe('Q');
    expect(imported[1].back).toBe('A');
  });

  it('accepts exchange records in an authoring envelope', () => {
    const imported = processJsonCards(
      { cards: records, default_tags: ['explicit'] },
      options
    );
    expect(imported[2].fields).toEqual(records[2].fields);
    expect(imported[2].tags).toEqual(['explicit']);
  });

  it('preserves field names that are also JavaScript object properties', () => {
    const fields = JSON.parse(
      '{"__proto__":"raw value","constructor":"another value","Text":"question"}'
    );
    const imported = processJsonCards([{ ...records[0], fields }], options);
    expect(Object.keys(imported[0].fields!)).toEqual(Object.keys(fields));
    expect(JSON.stringify(imported[0].fields)).toBe(JSON.stringify(fields));
    expect(Object.getPrototypeOf(imported[0].fields)).toBe(Object.prototype);
  });

  it.each([{}, { Front: 123 }, { '': 'value' }, [], null])(
    'rejects malformed fields %j',
    fields => {
      expect(() =>
        processJsonCards([{ ...records[0], fields }], options)
      ).toThrow();
    }
  );

  it.each([null, {}, { cards: 'not-an-array' }, [null]])(
    'rejects malformed JSON structures %j',
    value => {
      expect(() => processJsonCards(value, options)).toThrow();
    }
  );
});

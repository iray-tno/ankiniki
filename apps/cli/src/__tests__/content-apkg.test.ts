import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import JSZip from 'jszip';
import type { ContentPackage } from '@ankiniki/shared';
import { exportContentApkg, parseReleaseTime } from '../content-apkg';
import { createContentCommand } from '../commands/content';

const source = fileURLToPath(
  new URL('../../../../docs/examples/content/basic-practice/', import.meta.url)
);
const release = { modifiedAt: '2026-10-14T12:00:00Z', public: true };
let root: string;
let manifest: string;
let content: ContentPackage;
const previousExitCode = process.exitCode;

function save() {
  fs.writeFileSync(manifest, JSON.stringify(content));
}
async function artifact(filename: string) {
  const zip = await JSZip.loadAsync(fs.readFileSync(filename));
  const db = new DatabaseSync(':memory:');
  try {
    db.deserialize(await zip.file('collection.anki2')!.async('uint8array'));
    return {
      zip,
      notes: db
        .prepare(
          'SELECT id,guid,mid,mod,flds,sfld,csum,flags,data FROM notes ORDER BY id'
        )
        .all(),
      cards: db.prepare('SELECT * FROM cards ORDER BY id').all(),
      col: db.prepare('SELECT * FROM col').get()!,
      history: db.prepare('SELECT count(*) AS count FROM revlog').get()!.count,
      deleted: db.prepare('SELECT count(*) AS count FROM graves').get()!.count,
      integrity: db.prepare('PRAGMA integrity_check').get()!,
    };
  } finally {
    db.close();
  }
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ankiniki-apkg-test-'));
  fs.mkdirSync(path.join(root, 'audio'));
  fs.copyFileSync(
    path.join(source, 'audio', 'cue.wav'),
    path.join(root, 'audio', 'cue.wav')
  );
  content = JSON.parse(
    fs.readFileSync(path.join(source, 'content.json'), 'utf8')
  );
  manifest = path.join(root, 'content.json');
  save();
  process.exitCode = undefined;
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = previousExitCode;
  fs.rmSync(root, { recursive: true, force: true });
});

describe('lesson APKG publisher', () => {
  it('produces a standalone model, fresh cards and exact audio bytes', async () => {
    const output = path.join(root, 'lesson.apkg');
    const result = await exportContentApkg(manifest, output, release);
    expect(result.noteCount).toBe(4);
    expect(result.mediaCount).toBe(1);
    const apkg = await artifact(output);
    expect(apkg.notes).toHaveLength(4);
    expect(apkg.cards).toHaveLength(4);
    expect(apkg.integrity.integrity_check).toBe('ok');
    expect(apkg.history).toBe(0);
    expect(apkg.deleted).toBe(0);
    const models = Object.values(JSON.parse(String(apkg.col.models))) as any[];
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('Ankiniki Content v1');
    expect(models[0].flds.map((field: any) => field.name)).toEqual([
      'ContentId',
      'Front',
      'Back',
    ]);
    expect(models[0].flds.map((field: any) => field.id)).toEqual([
      1001, 1002, 1003,
    ]);
    expect(models[0].tmpls[0].id).toBe(2001);
    expect(JSON.parse(String(apkg.col.dconf))).toEqual({});
    for (const card of apkg.cards) {
      expect(card).toMatchObject({
        type: 0,
        queue: 0,
        reps: 0,
        lapses: 0,
        ivl: 0,
        flags: 0,
        data: '',
      });
      expect(apkg.notes.some(note => note.id === card.nid)).toBe(true);
    }
    const media = JSON.parse(await apkg.zip.file('media')!.async('string'));
    expect(Object.values(media)).toEqual([
      `ankiniki-${content.assets[0].sha256}.wav`,
    ]);
    expect(await apkg.zip.file('0')!.async('nodebuffer')).toEqual(
      fs.readFileSync(path.join(root, 'audio', 'cue.wav'))
    );
    expect(String(apkg.notes[3].flds)).toContain(`[sound:${media['0']}]`);
    expect(Object.keys(apkg.zip.files).sort()).toEqual([
      '0',
      'collection.anki2',
      'media',
    ]);
  });

  it('is reproducible for the same lesson and release time', async () => {
    const first = path.join(root, 'one.apkg');
    const second = path.join(root, 'two.apkg');
    await exportContentApkg(manifest, first, release);
    await exportContentApkg(manifest, second, release);
    expect(fs.readFileSync(second)).toEqual(fs.readFileSync(first));
  });

  it('keeps GUIDs and model identities after revision, text, deck and order changes', async () => {
    const first = path.join(root, 'one.apkg');
    await exportContentApkg(manifest, first, release);
    const before = await artifact(first);
    content.revision++;
    content.items[0].answer = 'Revised answer';
    content.items.reverse();
    save();
    const second = path.join(root, 'two.apkg');
    await exportContentApkg(manifest, second, {
      ...release,
      modifiedAt: '2026-10-14T12:01:00Z',
      deck: 'Renamed',
    });
    const after = await artifact(second);
    const identities = (rows: typeof before.notes) =>
      Object.fromEntries(
        rows.map(note => [String(note.flds).split('\x1f')[0], note.guid])
      );
    expect(identities(after.notes)).toEqual(identities(before.notes));
    expect(after.col.models).toBe(before.col.models);
    expect(String(after.notes[3].flds)).toContain('Revised answer');
    expect(after.notes[0].mod).toBe(parseReleaseTime('2026-10-14T12:01:00Z'));
  });

  it('keeps equal wording in separate activities and namespaces different packages', async () => {
    content.items[1].prompt = content.items[0].prompt;
    content.items[1].answer = content.items[0].answer;
    save();
    const first = path.join(root, 'one.apkg');
    await exportContentApkg(manifest, first, release);
    const before = await artifact(first);
    expect(new Set(before.notes.map(note => note.guid)).size).toBe(4);
    content.packageId = 'another-package';
    save();
    const second = path.join(root, 'two.apkg');
    await exportContentApkg(manifest, second, release);
    const after = await artifact(second);
    expect(
      after.notes.every(
        note => !before.notes.some(prior => prior.guid === note.guid)
      )
    ).toBe(true);
  });

  it('escapes HTML, Anki directives and field separators while retaining Unicode and whitespace', async () => {
    content.items[0].prompt =
      '  <script>alert("x")</script>\n[sound:private.mp3]\x1f日本語  ';
    content.items[0].sourceUrl = 'https://example.org/?x=1&y=2';
    save();
    const output = path.join(root, 'text.apkg');
    await exportContentApkg(manifest, output, release);
    const apkg = await artifact(output);
    const fields = String(apkg.notes[0].flds).split('\x1f');
    expect(fields).toHaveLength(3);
    expect(fields[1]).toContain(
      '  &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;\n&#91;sound:private.mp3&#93;&#31;日本語  '
    );
    expect(fields[1]).not.toContain('[sound:private.mp3]');
    expect(fields[2]).toContain('href="https://example.org/?x=1&amp;y=2"');
  });

  it('deduplicates shared prompt/answer audio and omits unused assets', async () => {
    fs.copyFileSync(
      path.join(root, 'audio', 'cue.wav'),
      path.join(root, 'audio', 'unused.wav')
    );
    content.assets.push({
      ...content.assets[0],
      assetId: 'unused',
      path: 'audio/unused.wav',
    });
    const activity = content.items[3].activities[0];
    content.assets[0].license = 'Audio license <original>';
    if (activity.kind === 'audio-response') {
      activity.answerAudioId = activity.promptAudioId;
    }
    save();
    const output = path.join(root, 'audio.apkg');
    const summary = await exportContentApkg(manifest, output, release);
    expect(summary.mediaCount).toBe(1);
    const apkg = await artifact(output);
    expect(String(apkg.notes[3].flds).match(/\[sound:/g)).toHaveLength(2);
    expect(String(apkg.notes[3].flds)).toContain(
      'Audio license &lt;original&gt;'
    );
    expect(Object.keys(apkg.zip.files)).toHaveLength(3);
  });

  it('supports text-only packages', async () => {
    content.items.pop();
    content.assets = [];
    save();
    const output = path.join(root, 'text.apkg');
    expect(
      (await exportContentApkg(manifest, output, release)).mediaCount
    ).toBe(0);
    expect(Object.keys((await artifact(output)).zip.files).sort()).toEqual([
      'collection.anki2',
      'media',
    ]);
  });

  it.each(['private-package', 'private-asset', 'changed-media', 'bad-version'])(
    'rejects %s before producing output',
    async mode => {
      if (mode === 'private-package') {
        content.visibility = 'private';
      }
      if (mode === 'private-asset') {
        content.assets[0].visibility = 'private';
      }
      if (mode === 'changed-media') {
        fs.writeFileSync(path.join(root, 'audio', 'cue.wav'), 'changed');
      }
      save();
      if (mode === 'bad-version') {
        fs.writeFileSync(
          manifest,
          JSON.stringify({ ...content, formatVersion: 99 })
        );
      }
      const output = path.join(root, 'failure.apkg');
      await expect(
        exportContentApkg(manifest, output, release)
      ).rejects.toThrow();
      expect(fs.existsSync(output)).toBe(false);
      expect(
        fs.readdirSync(root).some(name => name.startsWith('.ankiniki-'))
      ).toBe(false);
    }
  );

  it('allows private local output only without the public check', async () => {
    content.visibility = 'private';
    delete content.license;
    save();
    expect(
      (
        await exportContentApkg(manifest, path.join(root, 'private.apkg'), {
          ...release,
          public: false,
        })
      ).checkedForPublication
    ).toBe(false);
  });

  it('refuses existing output, supports explicit replacement and leaves no staging files', async () => {
    const output = path.join(root, 'existing.apkg');
    fs.writeFileSync(output, 'keep me');
    await expect(exportContentApkg(manifest, output, release)).rejects.toThrow(
      'already exists'
    );
    expect(fs.readFileSync(output, 'utf8')).toBe('keep me');
    await exportContentApkg(manifest, output, { ...release, force: true });
    expect((await artifact(output)).notes).toHaveLength(4);
    expect(
      fs.readdirSync(root).some(name => name.startsWith('.ankiniki-'))
    ).toBe(false);
  });

  it('does not overwrite source inputs even with --force', async () => {
    const sourcePath = path.join(root, 'source.apkg');
    fs.renameSync(manifest, sourcePath);
    const before = fs.readFileSync(sourcePath);
    await expect(
      exportContentApkg(sourcePath, sourcePath, { ...release, force: true })
    ).rejects.toThrow('lesson input');
    expect(fs.readFileSync(sourcePath)).toEqual(before);
  });

  it.each(['collection.apkg', 'collection.colpkg', 'notes.json'])(
    'rejects the unsafe output filename %s',
    async name => {
      await expect(
        exportContentApkg(manifest, path.join(root, name), release)
      ).rejects.toThrow('deck filename');
    }
  );

  it('returns a clean CLI JSON result and a nonzero JSON failure', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const target = path.join(root, 'cli.apkg');
    const args = [
      'node',
      'content',
      'export',
      manifest,
      target,
      '--modified-at',
      release.modifiedAt,
      '--public',
      '--json',
    ];
    await createContentCommand().parseAsync(args);
    expect(output).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0]).noteCount).toBe(4);
    expect(process.exitCode).toBeUndefined();
    await createContentCommand().parseAsync(args);
    expect(JSON.parse(errors.mock.calls[0][0]).valid).toBe(false);
    expect(process.exitCode).toBe(1);
  });
});

describe('release modification time', () => {
  it.each([
    '',
    '2026-02-30T12:00:00Z',
    '2026-10-14',
    '2099-01-01T00:00:00Z',
    '2026-10-14T12:00:00.001Z',
  ])('rejects %j', value => {
    expect(() => parseReleaseTime(value)).toThrow('modified-at');
  });
});

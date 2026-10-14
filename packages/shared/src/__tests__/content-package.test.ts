import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ContentPackageSchema,
  assertPublicContent,
  contentActivityKey,
  isPortableContentPath,
  type ContentPackage,
} from '../content-package';

const original: ContentPackage = JSON.parse(
  readFileSync(
    new URL(
      '../../../../docs/examples/content/basic-practice/content.json',
      import.meta.url
    ),
    'utf8'
  )
);
const fixture = () => structuredClone(original);

describe('lesson content contract', () => {
  it('accepts the self-authored recall and audio-response fixture', () => {
    const content = ContentPackageSchema.parse(fixture());
    expect(content.items).toHaveLength(4);
    expect(content.items[3].activities[0].kind).toBe('audio-response');
    expect(() => assertPublicContent(content)).not.toThrow();
  });

  it('retains text literally and keeps identity across revisions and edits', () => {
    const before = fixture();
    const changed = fixture();
    changed.revision++;
    changed.items[0].prompt = '  <code>test</code>\n日本語  ';
    changed.items[0].answer = 'updated answer';
    const parsed = ContentPackageSchema.parse(changed);
    expect(parsed.items[0].prompt).toBe(changed.items[0].prompt);
    expect(
      contentActivityKey(
        parsed.packageId,
        parsed.items[0].itemId,
        parsed.items[0].activities[0].activityId
      )
    ).toBe(
      contentActivityKey(
        before.packageId,
        before.items[0].itemId,
        before.items[0].activities[0].activityId
      )
    );
    expect(
      contentActivityKey(parsed.packageId, parsed.items[0].itemId, 'recall')
    ).not.toBe(
      contentActivityKey(parsed.packageId, parsed.items[1].itemId, 'recall')
    );
  });

  it.each([
    ['version', { formatVersion: 2 }],
    ['other format', { format: 'anki-notes' }],
    ['empty lesson', { items: [] }],
    ['unsafe revision', { revision: Number.MAX_SAFE_INTEGER + 1 }],
    ['missing visibility', { visibility: undefined }],
    ['missing public license', { license: undefined }],
    ['progress data', { reviewEvents: [] }],
    ['collection IDs', { noteId: 123 }],
    ['executable extensions', { script: 'alert(1)' }],
  ])('rejects %s instead of discarding unsupported data', (_name, changes) => {
    expect(
      ContentPackageSchema.safeParse({ ...fixture(), ...changes }).success
    ).toBe(false);
  });

  it('rejects duplicate item IDs and activities within an item', () => {
    const content = fixture();
    content.items[1].itemId = content.items[0].itemId;
    expect(ContentPackageSchema.safeParse(content).success).toBe(false);
    const another = fixture();
    another.items[0].activities.push({ ...another.items[0].activities[0] });
    expect(ContentPackageSchema.safeParse(another).success).toBe(false);
  });

  it('rejects duplicate asset IDs and paths differing only in case', () => {
    const content = fixture();
    content.assets.push({ ...content.assets[0], path: 'audio/another.wav' });
    expect(ContentPackageSchema.safeParse(content).success).toBe(false);
    const another = fixture();
    another.assets.push({
      ...another.assets[0],
      assetId: 'another',
      path: 'Audio/CUE.wav',
    });
    expect(ContentPackageSchema.safeParse(another).success).toBe(false);
  });

  it.each(['promptAudioId', 'answerAudioId'] as const)(
    'rejects unresolved %s',
    field => {
      const content = fixture();
      const activity = content.items[3].activities[0];
      if (activity.kind !== 'audio-response') {
        throw new Error('Expected an audio fixture');
      }
      activity[field] = 'missing';
      expect(ContentPackageSchema.safeParse(content).success).toBe(false);
    }
  );

  it('rejects an unknown activity rather than turning it into recall', () => {
    const content = fixture();
    const item = {
      ...content.items[0],
      activities: [{ activityId: 'custom', kind: 'run-code' }],
    };
    expect(
      ContentPackageSchema.safeParse({ ...content, items: [item] }).success
    ).toBe(false);
  });

  it('rejects blank answers, invalid delays and executable source URLs', () => {
    const content = fixture();
    content.items[0].answer = ' \n ';
    expect(ContentPackageSchema.safeParse(content).success).toBe(false);
    const another = fixture();
    another.items[0].sourceUrl = 'javascript:alert(1)';
    expect(ContentPackageSchema.safeParse(another).success).toBe(false);
    const activity = another.items[3].activities[0];
    if (activity.kind !== 'audio-response') {
      throw new Error('Expected an audio fixture');
    }
    delete another.items[0].sourceUrl;
    activity.responseSeconds = -1;
    expect(ContentPackageSchema.safeParse(another).success).toBe(false);
  });

  it('allows private lessons locally but refuses them for publication', () => {
    const content = fixture();
    content.visibility = 'private';
    delete content.license;
    const parsed = ContentPackageSchema.parse(content);
    expect(() => assertPublicContent(parsed)).toThrow(
      'Package must be explicitly public'
    );
  });

  it('does not infer permission for private assets from a public lesson', () => {
    const content = fixture();
    content.assets[0].visibility = 'private';
    delete content.assets[0].license;
    const parsed = ContentPackageSchema.parse(content);
    expect(() => assertPublicContent(parsed)).toThrow('Asset practice-cue');
  });

  it('requires an explicit public asset license and rejects asset progress data', () => {
    const content = fixture();
    delete content.assets[0].license;
    expect(ContentPackageSchema.safeParse(content).success).toBe(false);
    const another = fixture();
    const asset = { ...another.assets[0], recordings: ['personal.wav'] };
    expect(
      ContentPackageSchema.safeParse({ ...another, assets: [asset] }).success
    ).toBe(false);
  });
});

describe('portable content asset paths', () => {
  it.each(['audio/cue.wav', '音声/練習 1.wav', 'cue.wav'])(
    'accepts %s',
    value => {
      expect(isPortableContentPath(value)).toBe(true);
    }
  );
  it.each([
    '',
    '/audio.wav',
    '../audio.wav',
    'audio/../../secret.wav',
    'audio/./cue.wav',
    'audio//cue.wav',
    'C:/audio.wav',
    'audio\\cue.wav',
    'https://example.org/a.wav',
    'file:cue.wav',
    'audio/cue.wav:stream',
    'audio/%2e%2e/secret.wav',
    'audio/cue.wav#fragment',
    'audio/CON.wav',
    'audio/lpt1.wav',
    'audio/cue.wav.',
    'audio/cue.wav ',
    'audio/cu\u0000e.wav',
  ])('rejects %j', value => {
    expect(isPortableContentPath(value)).toBe(false);
  });
});

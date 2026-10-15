import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import JSZip from 'jszip';
import { contentActivityKey, type ContentPackage } from '@ankiniki/shared';
import { CONTENT_APKG_SCHEMA, contentDeck } from './content-apkg-schema';
import {
  loadContentFile,
  readContentAsset,
  type ContentValidationOptions,
} from './content-files';

export interface ContentExportOptions extends ContentValidationOptions {
  modifiedAt: string;
  deck?: string;
  force?: boolean;
}

const MODEL_NAME = 'Ankiniki Content v1';
const MODEL_MOD = Date.parse('2026-10-14T00:00:00Z') / 1000;
const CSS =
  '.card { font-family: sans-serif; text-align: left; } .content-text { font: inherit; white-space: pre-wrap; } .metadata { font-size: .8em; opacity: .7; }';
const TEXT_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '[': '&#91;',
  ']': '&#93;',
};

function numericId(key: string): number {
  return Number.parseInt(
    createHash('sha256').update(key).digest('hex').slice(0, 12),
    16
  );
}

/** Escapes text, field separators and Anki's own square-bracket directives. */
function escapeText(value: string): string {
  return [...value]
    .map(char => {
      const code = char.charCodeAt(0);
      return (
        TEXT_ESCAPES[char] ??
        ((code < 32 && !['\n', '\r', '\t'].includes(char)) || code === 127
          ? `&#${code};`
          : char)
      );
    })
    .join('');
}

export function parseReleaseTime(value: string): number {
  const time = Date.parse(value);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) ||
    !Number.isFinite(time) ||
    time < Date.UTC(1980, 0, 1) ||
    new Date(time).toISOString() !== value.replace('Z', '.000Z') ||
    time > Date.now()
  ) {
    throw new Error(
      'modified-at must be a valid, non-future UTC timestamp from 1980 onward, such as 2026-10-14T12:00:00Z'
    );
  }
  return time / 1000;
}

function renderNotes(content: ContentPackage, audio: Map<string, string>) {
  return content.items.flatMap(item =>
    item.activities.map(activity => {
      const key = contentActivityKey(
        content.packageId,
        item.itemId,
        activity.activityId
      );
      const guid = createHash('sha256')
        .update(`ankiniki-content-note-v1\0${key}`)
        .digest('base64url')
        .slice(0, 22);
      let front = `<pre class="content-text">${escapeText(item.prompt)}</pre>`;
      let back = `<pre class="content-text">${escapeText(item.answer)}</pre>`;
      switch (activity.kind) {
        case 'recall':
          break;
        case 'audio-response': {
          front += `[sound:${audio.get(activity.promptAudioId)}]`;
          if (activity.answerAudioId) {
            back += `[sound:${audio.get(activity.answerAudioId)}]`;
          }
          front += `<p class="metadata">Response window: ${activity.responseSeconds}s (self-paced)</p>`;
          const assetIds = new Set([
            activity.promptAudioId,
            ...(activity.answerAudioId ? [activity.answerAudioId] : []),
          ]);
          for (const asset of content.assets) {
            if (assetIds.has(asset.assetId) && asset.license) {
              back += `<p class="metadata">Audio ${escapeText(asset.assetId)}: ${escapeText(asset.license)}</p>`;
            }
          }
          break;
        }
        default: {
          const unsupported: never = activity;
          throw new Error(`Unsupported activity: ${String(unsupported)}`);
        }
      }
      if (item.explanation) {
        back += `<pre class="content-text">${escapeText(item.explanation)}</pre>`;
      }
      const attribution = [
        content.title,
        content.packageId,
        `revision ${content.revision}`,
        content.license,
      ]
        .filter(Boolean)
        .join(' · ');
      back += `<p class="metadata">${escapeText(attribution)}</p>`;
      if (item.sourceUrl) {
        back += `<p><a href="${escapeText(item.sourceUrl)}">${escapeText(item.sourceUrl)}</a></p>`;
      }
      return { key, guid, front, back };
    })
  );
}

function assertOutput(
  outputPath: string,
  protectedPaths: string[],
  force: boolean
) {
  if (
    path.extname(outputPath) !== '.apkg' ||
    path.basename(outputPath).toLowerCase() === 'collection.apkg'
  ) {
    throw new Error(
      'Choose a deck filename ending in .apkg, other than collection.apkg'
    );
  }
  const stat = fs.lstatSync(outputPath, { throwIfNoEntry: false });
  if (stat) {
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error('Output must be a regular file, not a link or directory');
    }
    const realOutput = fs.realpathSync(outputPath);
    if (
      protectedPaths.some(input =>
        process.platform === 'win32'
          ? input.toLowerCase() === realOutput.toLowerCase()
          : input === realOutput
      )
    ) {
      throw new Error('Output cannot replace a lesson input');
    }
    if (!force) {
      throw new Error(
        'Output already exists; choose another path or use --force'
      );
    }
  }
}

export async function exportContentApkg(
  filePath: string,
  output: string,
  options: ContentExportOptions
) {
  const modified = parseReleaseTime(options.modifiedAt);
  const loaded = loadContentFile(filePath, options);
  const { content } = loaded;
  const outputPath = path.resolve(output);
  const protectedPaths = [loaded.manifestPath, ...loaded.assetPaths.values()];
  assertOutput(outputPath, protectedPaths, options.force === true);
  const deckName = options.deck ?? `Ankiniki::${content.packageId}`;
  if (
    deckName.split('::').some(part => !part.trim()) ||
    [...deckName].some(
      char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127
    )
  ) {
    throw new Error(
      'Deck name must be non-empty and contain no control characters'
    );
  }
  const usedAudio = new Set(
    content.items.flatMap(item =>
      item.activities.flatMap(activity =>
        activity.kind === 'audio-response'
          ? [
              activity.promptAudioId,
              ...(activity.answerAudioId ? [activity.answerAudioId] : []),
            ]
          : []
      )
    )
  );
  const extensions = {
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
  };
  const audio = new Map<string, string>();
  const media = new Map<string, Buffer>();
  for (const asset of content.assets) {
    if (!usedAudio.has(asset.assetId)) {
      continue;
    }
    const name = `ankiniki-${asset.sha256}.${extensions[asset.mediaType]}`;
    audio.set(asset.assetId, name);
    media.set(name, readContentAsset(loaded.root, asset));
  }
  const notes = renderNotes(content, audio);
  if (new Set(notes.map(note => note.guid)).size !== notes.length) {
    throw new Error('Note identity collision');
  }

  const zip = new JSZip();
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(CONTENT_APKG_SCHEMA);
    const modelId = numericId('ankiniki-content-model-v1');
    const deckId = numericId(`ankiniki-content-deck-v1\0${content.packageId}`);
    const model = {
      id: modelId,
      name: MODEL_NAME,
      mod: MODEL_MOD,
      did: 1,
      sortf: 0,
      type: 0,
      usn: -1,
      latexPre: '',
      latexPost: '',
      vers: [],
      tags: [],
      flds: ['ContentId', 'Front', 'Back'].map((name, ord) => ({
        name,
        ord,
        id: 1001 + ord,
        font: 'Arial',
        size: 20,
        rtl: false,
        sticky: false,
        media: [],
      })),
      tmpls: [
        {
          name: 'Practice',
          ord: 0,
          id: 2001,
          qfmt: '{{Front}}',
          afmt: '{{FrontSide}}<hr id="answer">{{Back}}',
          bqfmt: '',
          bafmt: '',
          did: null,
        },
      ],
      req: [[0, 'all', [1]]],
      css: CSS,
    };
    const deck = contentDeck(deckId, deckName, modified);
    const conf = {
      nextPos: notes.length + 1,
      activeDecks: [deckId],
      curDeck: deckId,
      curModel: String(modelId),
    };
    db.prepare('INSERT INTO col VALUES(1,?,?,?,11,0,0,0,?,?,?,?,?)').run(
      Math.floor(modified / 86400) * 86400,
      modified * 1000,
      MODEL_MOD * 1000,
      JSON.stringify(conf),
      JSON.stringify({ [modelId]: model }),
      JSON.stringify({
        1: contentDeck(1, 'Default', MODEL_MOD),
        [deckId]: deck,
      }),
      '{}',
      '{}'
    );
    const insertNote = db.prepare(
      'INSERT INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)'
    );
    const insertCard = db.prepare(
      'INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    notes.forEach((note, index) => {
      const id = modified * 1000 + index + 1;
      const fields = [note.key, note.front, note.back].join('\x1f');
      const checksum = createHash('sha1')
        .update(note.key)
        .digest()
        .readUInt32BE(0);
      insertNote.run(
        id,
        note.guid,
        modelId,
        modified,
        -1,
        ' ankiniki::content ',
        fields,
        note.key,
        checksum,
        0,
        ''
      );
      insertCard.run(
        id,
        id,
        deckId,
        0,
        modified,
        -1,
        0,
        0,
        index + 1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ''
      );
    });
    db.exec('VACUUM');
    zip.file('collection.anki2', db.serialize());
  } finally {
    db.close();
  }
  const mediaIndex: Record<string, string> = {};
  [...media.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, bytes], index) => {
      mediaIndex[String(index)] = name;
      zip.file(String(index), bytes);
    });
  zip.file('media', JSON.stringify(mediaIndex));
  zip.forEach((_name, entry) => {
    entry.date = new Date(modified * 1000);
  });
  const bytes = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  assertOutput(outputPath, protectedPaths, options.force === true);
  const staged = path.join(
    path.dirname(outputPath),
    `.ankiniki-${randomUUID()}.tmp`
  );
  try {
    fs.writeFileSync(staged, bytes, { flag: 'wx' });
    if (options.force) {
      fs.renameSync(staged, outputPath);
    } else {
      fs.linkSync(staged, outputPath);
    }
  } finally {
    if (fs.existsSync(staged)) {
      fs.unlinkSync(staged);
    }
  }
  return {
    packageId: content.packageId,
    revision: content.revision,
    noteCount: notes.length,
    mediaCount: media.size,
    modifiedAt: options.modifiedAt,
    outputPath,
    checkedForPublication: options.public === true,
  };
}

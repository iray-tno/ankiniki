import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratchRoot = join(root, 'temp');
mkdirSync(scratchRoot, { recursive: true });
const scratch = mkdtempSync(join(scratchRoot, 'json-smoke-'));
const records = JSON.parse(
  readFileSync(join(root, 'docs/examples/json/anki-notes.json'), 'utf8')
);
const models = new Map(
  records.map(note => [note.modelName, Object.keys(note.fields)])
);
const decks = new Set(['Programming', ...records.map(note => note.deckName)]);
const writes = [];

const fakeAnki = createServer(async (req, res) => {
  try {
    if (req.method === 'GET') {
      res.end(JSON.stringify({ status: 'unavailable' }));
      return;
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    const { action, params } = JSON.parse(body);
    let result;
    switch (action) {
      case 'version':
        result = 6;
        break;
      case 'deckNames':
        result = [...decks];
        break;
      case 'modelNames':
        result = [...models.keys()];
        break;
      case 'modelFieldNames':
        result = models.get(params.modelName);
        break;
      case 'findNotes':
        result = records.map(note => note.noteId);
        break;
      case 'notesInfo':
        result = records.map(note => ({
          ...note,
          cards: [],
          fields: Object.fromEntries(
            Object.entries(note.fields).map(([name, value], order) => [
              name,
              { value, order },
            ])
          ),
        }));
        break;
      case 'createDeck':
        decks.add(params.deck);
        result = 123;
        break;
      case 'addNote':
        writes.push(params.note);
        result = 1800000000000 + writes.length;
        break;
      default:
        throw new Error(`Unexpected Anki action: ${action}`);
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ result, error: null }));
  } catch (error) {
    res.end(JSON.stringify({ result: null, error: String(error) }));
  }
});

const listen = server =>
  new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const close = server =>
  new Promise((resolveClose, rejectClose) =>
    server.close(error => (error ? rejectClose(error) : resolveClose()))
  );
const execute = promisify(execFile);
let backendUrl;

async function assertBackendStopped() {
  // A CLI-owned server must not be left behind, including on import errors.
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(200) });
    } catch {
      return;
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
  }
  throw new Error('CLI left its owned backend running');
}

try {
  await listen(fakeAnki);
  const portReservation = createServer();
  await listen(portReservation);
  const port = portReservation.address().port;
  await close(portReservation);
  backendUrl = `http://127.0.0.1:${port}`;
  const configPath = join(scratch, 'config.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      ankiConnectUrl: `http://127.0.0.1:${fakeAnki.address().port}`,
      serverUrl: backendUrl,
    })
  );
  const cli = args =>
    execute(process.execPath, [join(root, 'apps/cli/dist/index.js'), ...args], {
      cwd: root,
      windowsHide: true,
      timeout: 15000,
      env: {
        ...process.env,
        ANKINIKI_CONFIG_PATH: configPath,
        ML_SERVICE_URL: `http://127.0.0.1:${fakeAnki.address().port}`,
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
      },
    });
  const output = join(scratch, 'export.json');
  await cli(['export', 'Programming', output, '--format', 'json']);
  const exported = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(exported.length, records.length);
  records.forEach((note, index) =>
    assert.deepEqual(exported[index].fields, note.fields)
  );

  const preview = await cli(['note', 'import', output, '--preview']);
  assert.match(preview.stdout, /Code:/);
  assert.match(preview.stdout, /Source:/);
  assert.equal(writes.length, 0);
  await assertBackendStopped();

  await cli(['note', 'import', output, '--deck-name', 'Programming Copy']);
  assert.equal(writes.length, records.length);
  records.forEach((note, index) => {
    assert.deepEqual(writes[index], {
      deckName: 'Programming Copy',
      modelName: note.modelName,
      fields: note.fields,
      tags: note.tags,
    });
  });
  await assertBackendStopped();

  models.clear();
  await assert.rejects(
    cli(['note', 'import', output]),
    error => error.code === 1
  );
  assert.equal(writes.length, records.length);
  await assertBackendStopped();
  console.log(
    'CLI JSON export, preview, import and failure cleanup passed against an isolated Anki stub.'
  );
} finally {
  await close(fakeAnki);
  const target = resolve(scratch);
  assert.ok(target.startsWith(resolve(scratchRoot) + sep));
  rmSync(target, { recursive: true, force: true });
}

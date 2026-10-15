import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const scratch = path.join(repo, 'temp');
fs.mkdirSync(scratch, { recursive: true });
const workspace = fs.mkdtempSync(path.join(scratch, 'content-apkg-smoke-'));
const input = path.join(workspace, 'input');
const manifest = path.join(input, 'content.json');
const release = ['--modified-at', '2026-10-14T12:00:00Z', '--public', '--json'];
function run(output, expected) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(repo, 'apps/cli/dist/index.js'),
      'content',
      'export',
      manifest,
      output,
      ...release,
    ],
    {
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
      env: {
        ...process.env,
        ANKINIKI_CONFIG_PATH: path.join(workspace, 'config.json'),
      },
    }
  );
  assert.equal(result.status, expected, result.error?.message ?? result.stderr);
  if (expected === 0) {
    return JSON.parse(result.stdout);
  }
  assert.equal(result.stdout, '');
  assert.equal(JSON.parse(result.stderr).valid, false);
}
try {
  fs.cpSync(path.join(repo, 'docs/examples/content/basic-practice'), input, {
    recursive: true,
  });
  const first = path.join(workspace, 'lesson.apkg');
  const second = path.join(workspace, 'copy.apkg');
  const summary = run(first, 0);
  assert.equal(summary.noteCount, 4);
  assert.equal(summary.mediaCount, 1);
  run(second, 0);
  const bytes = fs.readFileSync(first);
  assert.deepEqual(fs.readFileSync(second), bytes);
  run(first, 1);
  assert.deepEqual(fs.readFileSync(first), bytes);
  const content = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  content.visibility = 'private';
  fs.writeFileSync(manifest, JSON.stringify(content));
  const refused = path.join(workspace, 'refused.apkg');
  run(refused, 1);
  assert.equal(fs.existsSync(refused), false);
  console.log(
    'CLI lesson APKG export, reproducibility, overwrite refusal and private publication refusal passed.'
  );
} finally {
  const relative = path.relative(scratch, workspace);
  assert.ok(
    relative.startsWith('content-apkg-smoke-') && !relative.includes(path.sep)
  );
  fs.rmSync(workspace, { recursive: true, force: true });
}

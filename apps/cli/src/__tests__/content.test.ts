import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { ContentPackage } from '@ankiniki/shared';
import { createContentCommand, validateContentFile } from '../commands/content';

const source = fileURLToPath(
  new URL('../../../../docs/examples/content/basic-practice/', import.meta.url)
);
let root: string;
let manifest: string;
let content: ContentPackage;
const previousExitCode = process.exitCode;

function save() {
  fs.writeFileSync(manifest, JSON.stringify(content));
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ankiniki-content-test-'));
  manifest = path.join(root, 'content.json');
  content = JSON.parse(
    fs.readFileSync(path.join(source, 'content.json'), 'utf8')
  );
  fs.mkdirSync(path.join(root, 'audio'));
  fs.copyFileSync(
    path.join(source, 'audio', 'cue.wav'),
    path.join(root, 'audio', 'cue.wav')
  );
  save();
  process.exitCode = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = previousExitCode;
  fs.rmSync(root, { recursive: true, force: true });
});

describe('content file validation', () => {
  it('checks the fixture audio and reports counts without lesson text or local paths', () => {
    expect(validateContentFile(manifest, { public: true })).toEqual({
      valid: true,
      packageId: content.packageId,
      revision: 1,
      visibility: 'public',
      itemCount: 4,
      activityCount: 4,
      assetCount: 1,
      checkedForPublication: true,
    });
  });

  it('validates a private package locally without a public eligibility claim', () => {
    content.visibility = 'private';
    delete content.license;
    save();
    expect(validateContentFile(manifest).checkedForPublication).toBe(false);
    expect(() => validateContentFile(manifest, { public: true })).toThrow(
      'Package must be explicitly public'
    );
  });

  it('rejects a private media dependency before attempting to read it for publication', () => {
    content.assets[0].visibility = 'private';
    delete content.assets[0].license;
    save();
    fs.unlinkSync(path.join(root, 'audio', 'cue.wav'));
    expect(() => validateContentFile(manifest, { public: true })).toThrow(
      'Asset practice-cue'
    );
  });

  it('detects missing assets', () => {
    fs.unlinkSync(path.join(root, 'audio', 'cue.wav'));
    expect(() => validateContentFile(manifest)).toThrow();
  });

  it('rejects a directory used as an audio asset', () => {
    content.assets[0].path = 'audio';
    save();
    expect(() => validateContentFile(manifest)).toThrow('regular file');
  });

  it('detects truncated media through its declared byte length', () => {
    fs.writeFileSync(path.join(root, 'audio', 'cue.wav'), Buffer.from('short'));
    expect(() => validateContentFile(manifest)).toThrow('byte length');
  });

  it('detects same-length media changes through SHA-256', () => {
    const audioPath = path.join(root, 'audio', 'cue.wav');
    const bytes = fs.readFileSync(audioPath);
    bytes[bytes.length - 1] ^= 1;
    fs.writeFileSync(audioPath, bytes);
    expect(() => validateContentFile(manifest)).toThrow('SHA-256');
  });

  it('verifies complete audio across read-buffer boundaries', () => {
    const audioPath = path.join(root, 'audio', 'cue.wav');
    const bytes = Buffer.concat([
      fs.readFileSync(audioPath),
      Buffer.alloc(3 * 65536 + 18),
    ]);
    bytes.writeUInt32LE(bytes.length - 8, 4);
    bytes.writeUInt32LE(bytes.length - 44, 40);
    fs.writeFileSync(audioPath, bytes);
    content.assets[0].byteLength = bytes.length;
    content.assets[0].sha256 = createHash('sha256').update(bytes).digest('hex');
    save();
    expect(validateContentFile(manifest).assetCount).toBe(1);
  });

  it('checks assets that are declared but not referenced by an activity', () => {
    content.items.pop();
    save();
    fs.unlinkSync(path.join(root, 'audio', 'cue.wav'));
    expect(() => validateContentFile(manifest)).toThrow();
  });

  it('rejects a media directory linked outside the package root', () => {
    const outside = path.join(root, 'outside');
    const packageRoot = path.join(root, 'package');
    fs.mkdirSync(outside);
    fs.mkdirSync(packageRoot);
    fs.copyFileSync(
      path.join(source, 'audio', 'cue.wav'),
      path.join(outside, 'cue.wav')
    );
    fs.symlinkSync(
      outside,
      path.join(packageRoot, 'audio'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );
    const nestedManifest = path.join(packageRoot, 'content.json');
    fs.writeFileSync(nestedManifest, JSON.stringify(content));
    expect(() => validateContentFile(nestedManifest)).toThrow(
      'outside the package directory'
    );
  });

  it('preserves manifests and media rather than modifying them', () => {
    const before = fs.readFileSync(manifest);
    const audioPath = path.join(root, 'audio', 'cue.wav');
    const hashBefore = createHash('sha256')
      .update(fs.readFileSync(audioPath))
      .digest('hex');
    validateContentFile(manifest, { public: true });
    expect(fs.readFileSync(manifest)).toEqual(before);
    expect(
      createHash('sha256').update(fs.readFileSync(audioPath)).digest('hex')
    ).toBe(hashBefore);
  });
});

describe('content validate command', () => {
  it('provides a JSON success summary', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    await createContentCommand().parseAsync([
      'node',
      'content',
      'validate',
      manifest,
      '--public',
      '--json',
    ]);
    const result = JSON.parse(output.mock.calls[0][0]);
    expect(result.valid).toBe(true);
    expect(result.assetCount).toBe(1);
    expect(process.exitCode).toBeUndefined();
  });

  it.each(['malformed', 'unsupported', 'missing', 'private', 'changed-media'])(
    'returns exit code 1 for %s input',
    async mode => {
      const output = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      if (mode === 'malformed') {
        fs.writeFileSync(manifest, '{');
      } else if (mode === 'unsupported') {
        fs.writeFileSync(
          manifest,
          JSON.stringify({ ...content, formatVersion: 2 })
        );
      } else if (mode === 'missing') {
        fs.unlinkSync(manifest);
      } else if (mode === 'private') {
        content.visibility = 'private';
        save();
      } else {
        fs.writeFileSync(path.join(root, 'audio', 'cue.wav'), 'changed');
      }
      await createContentCommand().parseAsync([
        'node',
        'content',
        'validate',
        manifest,
        '--public',
        '--json',
      ]);
      expect(process.exitCode).toBe(1);
      expect(output).not.toHaveBeenCalled();
      expect(JSON.parse(errors.mock.calls[0][0]).valid).toBe(false);
    }
  );
});

import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Original synthetic cue, not speech or a recording from learning materials.
// Integer triangle samples keep the fixture reproducible across platforms.
const sampleRate = 16000;
const sampleCount = 8000;
const bytes = Buffer.alloc(44 + sampleCount * 2);
bytes.write('RIFF', 0);
bytes.writeUInt32LE(bytes.length - 8, 4);
bytes.write('WAVEfmt ', 8);
bytes.writeUInt32LE(16, 16);
bytes.writeUInt16LE(1, 20);
bytes.writeUInt16LE(1, 22);
bytes.writeUInt32LE(sampleRate, 24);
bytes.writeUInt32LE(sampleRate * 2, 28);
bytes.writeUInt16LE(2, 32);
bytes.writeUInt16LE(16, 34);
bytes.write('data', 36);
bytes.writeUInt32LE(sampleCount * 2, 40);
for (let index = 0; index < sampleCount; index++) {
  const active = index < 2400 || (index >= 4000 && index < 6400);
  const phase = index % 40;
  const triangle = phase < 10 ? phase : phase < 30 ? 20 - phase : phase - 40;
  bytes.writeInt16LE(active ? triangle * 250 : 0, 44 + index * 2);
}
const directory = new URL(
  '../docs/examples/content/basic-practice/audio/',
  import.meta.url
);
mkdirSync(directory, { recursive: true });
const target = new URL('cue.wav', directory);
writeFileSync(target, bytes);
console.log(
  JSON.stringify({
    path: fileURLToPath(target),
    byteLength: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  })
);

import { build } from 'esbuild';
import { chmodSync, mkdirSync } from 'fs';

mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Node built-ins are automatically external with platform:node.
  // anki-apkg-export uses a webpack script-loader shim that esbuild cannot
  // resolve; it is a pre-built CJS package so Node loads it fine at runtime.
  external: ['anki-apkg-export'],
});

chmodSync('dist/index.js', 0o755);

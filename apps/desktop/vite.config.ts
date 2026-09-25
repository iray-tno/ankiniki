import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { hozo } from '@hozo/vite';
import { resolve } from 'path';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // hozo() must come before react() so it processes raw JSX
  plugins: [hozo(), react()],
  root: './src/renderer',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    // Modern webview targets supported by Tauri v2
    target: ['es2022', 'chrome105', 'safari15'],
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src/renderer'),
      '@shared': resolve(import.meta.dirname, '../../packages/shared/src'),
    },
  },
});

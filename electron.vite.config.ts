import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: { index: resolve(root, 'electron/main.ts') },
      },
    },
  },
  preload: {
    // Preload is sandboxed: bundle everything and emit CommonJS (.cjs) so it
    // loads correctly even though the package is ESM ("type": "module").
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: { index: resolve(root, 'electron/preload.ts') },
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    root,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
        '@shared': resolve(root, 'shared'),
      },
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: { index: resolve(root, 'index.html') },
      },
    },
  },
});

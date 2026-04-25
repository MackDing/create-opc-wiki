import { defineConfig } from 'tsup';

export default defineConfig([
  // Bin entry — shebang + CLI behavior
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    minify: false,
    sourcemap: false,
    splitting: false,
    shims: false,
    banner: { js: '#!/usr/bin/env node' },
  },
  // Programmatic API — importable for tests and consumers
  {
    entry: { api: 'src/api.ts' },
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: false,
    minify: false,
    sourcemap: false,
    splitting: false,
    shims: false,
    dts: true,
  },
]);

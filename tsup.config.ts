import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  minify: false,
  sourcemap: false,
  splitting: false,
  shims: false,
  // Templates ship as raw files alongside dist/, copied at build time.
  // The CLI resolves them relative to import.meta.url so npm publish includes them via "files" field.
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Make the bin executable by tsup-emitting the shebang.
});

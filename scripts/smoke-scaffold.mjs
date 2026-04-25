// Smoke test for scaffold(). Bypasses interactive prompts.
// Generates a vault into /tmp/opc-wiki-smoke-<timestamp>, asserts core files exist.

import { rm, readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const apiPath = path.join(repoRoot, 'dist/api.js');
const { scaffold, resolveTemplatesDir, DEFAULT_DOMAINS } = await import(apiPath);

const target = path.join(tmpdir(), `opc-wiki-smoke-${Date.now()}`);
console.log(`[smoke] target: ${target}`);

const answers = {
  projectName: 'smoke-wiki',
  targetDir: target,
  domains: [...DEFAULT_DOMAINS],
  agents: ['claude', 'codex', 'cursor'],
  extras: ['mcp', 'recipes', 'astro'],
  includeRemoteDocs: true,
  initGit: false,
};

const tplDir = resolveTemplatesDir();
console.log(`[smoke] templates: ${tplDir}`);

const result = await scaffold(tplDir, target, answers);
console.log(`[smoke] ${result.filesWritten} files / ${result.dirsCreated} dirs`);
if (result.skipped.length > 0) {
  console.log(`[smoke] skipped: ${result.skipped.join(', ')}`);
}

const required = [
  'agent-rules/main.md',
  'agent-rules/.targets',
  'CLAUDE.md',
  'AGENTS.md',
  '.cursor/rules/main.mdc',
  'skills/wiki-ingest.md',
  'skills/wiki-query.md',
  'skills/wiki-lint.md',
  'USAGE.md',
  'index.md',
  'log.md',
  'wiki/_index.md',
  'wiki/tech/_index.md',
  'wiki/finance/_index.md',
  '.obsidian/app.json',
  'scripts/sync-agent-rules.sh',
  'docs/REMOTE-ACCESS.md',
  'README.md',
  '.gitignore',
];

let failed = 0;
for (const rel of required) {
  try {
    await access(path.join(target, rel));
    console.log(`  ✓ ${rel}`);
  } catch {
    console.log(`  ✗ ${rel}  MISSING`);
    failed++;
  }
}

// Sanity: privacy field must appear in main.md
const main = await readFile(path.join(target, 'agent-rules/main.md'), 'utf-8');
if (main.includes('privacy: public | private | secret')) {
  console.log('  ✓ privacy frontmatter present in main.md');
} else {
  console.log('  ✗ privacy frontmatter missing');
  failed++;
}

// Sanity: confidence decay rule present in wiki-lint.md
const lint = await readFile(path.join(target, 'skills/wiki-lint.md'), 'utf-8');
if (lint.includes('Confidence decay')) {
  console.log('  ✓ confidence decay rule present in wiki-lint');
} else {
  console.log('  ✗ confidence decay rule missing');
  failed++;
}

// Sanity: .targets file lists agents we requested
const targets = await readFile(path.join(target, 'agent-rules/.targets'), 'utf-8');
const expected = ['claude', 'codex', 'cursor'];
const actual = targets.split('\n').filter(Boolean);
if (expected.every((e) => actual.includes(e))) {
  console.log(`  ✓ .targets lists ${expected.join(', ')}`);
} else {
  console.log(`  ✗ .targets mismatch: ${actual.join(',')}`);
  failed++;
}

// Sanity: cursor mdc file has the alwaysApply prefix
const mdc = await readFile(path.join(target, '.cursor/rules/main.mdc'), 'utf-8');
if (mdc.startsWith('---\ndescription: Personal wiki agent rules\nalwaysApply: true\n---')) {
  console.log('  ✓ Cursor mdc prefix present');
} else {
  console.log('  ✗ Cursor mdc prefix missing or malformed');
  failed++;
}

// Cleanup
await rm(target, { recursive: true, force: true });

if (failed > 0) {
  console.log(`\n[smoke] FAILED with ${failed} issue(s)`);
  process.exit(1);
}
console.log('\n[smoke] ALL CHECKS PASSED');

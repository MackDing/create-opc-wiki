// Comprehensive smoke test for create-opc-wiki.
//
// What this checks (no network required, always runs):
//   [1/5] Programmatic scaffold via api.js — interactive-equivalent path
//   [2/5] CLI subprocess: agent-IM install path (--yes --json)
//   [3/5] CLI subprocess: --no-mcp --no-site --no-recipes
//   [4/5] CLI subprocess: --domains=ai,bio,papers
//   [5/5] Error paths (invalid flags, populated target, empty domains, unknown flag)
//   [*]   Repo-level Karpathy attribution regression
//
// Hard guarantees:
//   - Each test block is wrapped in try/finally so tmpdirs never leak
//   - Generated MCP server and site builder pass `node --check`
//   - Every error path returns --json {ok:false, error: string}
//
// For a full integration test (real npm install, MCP boot, site build),
// run scripts/e2e.mjs. That requires network for npm install.

import { rm, readFile, access, writeFile, mkdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const cliPath = path.join(repoRoot, 'dist/cli.js');
const KARPATHY_GIST = '442a6bf555914893e9891c11519de94f';

// Platform diagnostics — print up front so any failure has context in the run output.
console.log(`[smoke] platform=${process.platform} arch=${process.arch} node=${process.version}`);
console.log(`[smoke] cwd=${process.cwd()}`);
console.log(`[smoke] tmpdir=${tmpdir()}`);
console.log(`[smoke] cliPath=${cliPath}`);

// Global crash handlers — surface uncaught errors as workflow annotations
// (otherwise a thrown await inside a try-block-with-no-catch crashes silently
// before any fail() runs, and the public API only sees "exit code 1").
const surfaceCrash = (kind, err) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = (err instanceof Error && err.stack) ? err.stack.replace(/[\r\n]+/g, ' | ').slice(0, 800) : '';
  console.log(`\n[smoke] CRASH (${kind}) on ${process.platform}/node${process.version}: ${msg}`);
  if (stack) console.log(`[smoke] stack: ${stack}`);
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::error file=scripts/smoke-scaffold.mjs::[CRASH/${kind}/${process.platform}/node${process.version}] ${msg} | ${stack}`);
  }
  process.exit(1);
};
process.on('uncaughtException', (err) => surfaceCrash('uncaughtException', err));
process.on('unhandledRejection', (err) => surfaceCrash('unhandledRejection', err));

let failed = 0;
function dumpContext(label, content, max = 500) {
  const head = (content ?? '').slice(0, max);
  const bytes = Array.from(head.slice(0, 80)).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  console.log(`     ${label} (first ${max} chars):`);
  console.log(`     ${head.replace(/\r/g, '\\r').replace(/\n/g, '\\n\n     ')}`);
  console.log(`     hex(first 80 bytes): ${bytes}`);
}
const fail = (msg, ctx) => {
  console.log(`  ✗ ${msg}`);
  if (ctx) console.log(`     context: ${typeof ctx === 'string' ? ctx.slice(0, 400).replace(/\r/g,'\\r').replace(/\n/g,'\\n') : JSON.stringify(ctx).slice(0, 400)}`);
  failed++;
  // Workflow command — surfaces as a job annotation visible in the public API
  // even without admin log-download rights.
  if (process.env.GITHUB_ACTIONS) {
    const safeCtx = ctx ? ` | ctx: ${String(ctx).slice(0, 200).replace(/\r/g,'\\r').replace(/\n/g,'\\n')}` : '';
    console.log(`::error file=scripts/smoke-scaffold.mjs::[${process.platform}/node${process.version}] ${msg}${safeCtx}`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `- ❌ \`${process.platform}/node${process.version}\` ${msg}` +
        (ctx ? `\n  - context: \`${String(ctx).slice(0, 200).replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/`/g, '\\`')}\`` : '') +
        '\n');
    } catch {}
  }
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

function runCli(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [cliPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      timeout: 30_000, // bumped from 15s for slower Windows runners
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => resolve({ code, stdout, stderr }));
    proc.on('error', reject);
  });
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

const cleanup = async (p) => {
  try { await rm(p, { recursive: true, force: true }); } catch {}
};

// ---------- [1/5] programmatic scaffold ----------
console.log('\n[1/5] programmatic scaffold via api.js');
{
  const apiPath = path.join(repoRoot, 'dist/api.js');
  // On Windows, dynamic import() requires a file:// URL, not a bare absolute path
  // (otherwise the drive letter is parsed as a URL protocol like 'd:').
  const { scaffold, resolveTemplatesDir, DEFAULT_DOMAINS } = await import(pathToFileURL(apiPath).href);

  const target = path.join(tmpdir(), `opc-smoke-prog-${Date.now()}`);
  try {
    const answers = {
      projectName: 'smoke-wiki',
      targetDir: target,
      domains: [...DEFAULT_DOMAINS],
      agents: ['claude', 'codex', 'cursor'],
      extras: ['mcp', 'recipes', 'site'],
      includeRemoteDocs: true,
      initGit: false,
    };
    const result = await scaffold(resolveTemplatesDir(), target, answers);
    console.log(`     wrote ${result.filesWritten} files / ${result.dirsCreated} dirs`);

    const required = [
      'agent-rules/main.md', 'agent-rules/.targets',
      'CLAUDE.md', 'AGENTS.md', '.cursor/rules/main.mdc',
      'skills/wiki-ingest.md', 'skills/wiki-query.md', 'skills/wiki-lint.md',
      'USAGE.md', 'index.md', 'log.md',
      'wiki/_index.md', 'wiki/tech/_index.md', 'wiki/finance/_index.md',
      '.obsidian/app.json', 'scripts/sync-agent-rules.sh',
      'docs/REMOTE-ACCESS.md', 'README.md', '.gitignore',
      'mcp/server.mjs', 'mcp/package.json',
      'site/build.mjs', 'site/package.json', 'site/site.config.json', 'site/README.md',
      '.github/workflows/wiki-publish.yml',
      'recipes/_index.md', 'recipes/arxiv-paper.md',
    ];
    for (const rel of required) {
      const full = path.join(target, rel);
      if (await exists(full)) ok(rel);
      else fail(`MISSING: ${rel}`, `looked at: ${full}`);
    }

    const main = await readFile(path.join(target, 'agent-rules/main.md'), 'utf8');
    if (main.includes('privacy: public | private | secret')) ok('privacy frontmatter in main.md');
    else fail('privacy frontmatter missing');

    if (main.includes(KARPATHY_GIST)) ok('Karpathy gist URL in agent-rules/main.md');
    else fail('Karpathy gist URL missing from agent-rules/main.md');

    const lint = await readFile(path.join(target, 'skills/wiki-lint.md'), 'utf8');
    if (lint.includes('Confidence decay')) ok('confidence decay in wiki-lint');
    else fail('confidence decay missing');

    const targets = (await readFile(path.join(target, 'agent-rules/.targets'), 'utf8'))
      .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (['claude', 'codex', 'cursor'].every((e) => targets.includes(e))) ok('.targets enumerates agents');
    else fail(`.targets mismatch: ${targets.join(',')}`, JSON.stringify(targets));

    const mdc = await readFile(path.join(target, '.cursor/rules/main.mdc'), 'utf8');
    const mdcNormalized = mdc.replace(/\r\n/g, '\n');
    if (mdcNormalized.startsWith('---\ndescription: Personal wiki agent rules\nalwaysApply: true\n---')) ok('Cursor mdc prefix present');
    else { fail('Cursor mdc prefix malformed'); dumpContext('mdc head', mdc, 200); }

    const usage = await readFile(path.join(target, 'USAGE.md'), 'utf8');
    if (usage.includes(KARPATHY_GIST)) ok('Karpathy gist URL in USAGE.md');
    else fail('Karpathy gist URL missing from USAGE.md');

    const indexMd = await readFile(path.join(target, 'index.md'), 'utf8');
    if (indexMd.includes(KARPATHY_GIST)) ok('Karpathy gist URL in index.md');
    else fail('Karpathy gist URL missing from index.md');

    try {
      JSON.parse(await readFile(path.join(target, 'site/site.config.json'), 'utf8'));
      ok('site.config.json is valid JSON');
    } catch (e) { fail(`site.config.json invalid: ${e.message}`); }
    try {
      JSON.parse(await readFile(path.join(target, 'mcp/package.json'), 'utf8'));
      ok('mcp/package.json is valid JSON');
    } catch (e) { fail(`mcp/package.json invalid: ${e.message}`); }
    try {
      JSON.parse(await readFile(path.join(target, 'site/package.json'), 'utf8'));
      ok('site/package.json is valid JSON');
    } catch (e) { fail(`site/package.json invalid: ${e.message}`); }

    const nodeCheck = (file) =>
      new Promise((res) => {
        const p = spawn(process.execPath, ['--check', file], { stdio: 'pipe' });
        let stderr = '';
        p.stderr.on('data', (d) => (stderr += d.toString()));
        p.on('close', (c) => res({ code: c, stderr }));
      });
    const mcpCheck = await nodeCheck(path.join(target, 'mcp/server.mjs'));
    if (mcpCheck.code === 0) ok('mcp/server.mjs syntax valid');
    else fail(`mcp/server.mjs syntax error:\n${mcpCheck.stderr}`);
    const siteCheck = await nodeCheck(path.join(target, 'site/build.mjs'));
    if (siteCheck.code === 0) ok('site/build.mjs syntax valid');
    else fail(`site/build.mjs syntax error:\n${siteCheck.stderr}`);
  } finally {
    await cleanup(target);
  }
}

// ---------- [2/5] CLI subprocess: agent-IM install path ----------
console.log('\n[2/5] CLI subprocess: agent-IM install path (--yes --json)');
{
  const target = path.join(tmpdir(), `opc-smoke-im-${Date.now()}`);
  try {
    const r = await runCli([target, '--yes', '--agents=openclaw,hermes,claude', '--json', '--no-git']);
    if (r.code !== 0) {
      fail(`CLI exited ${r.code}`, `stderr: ${r.stderr.slice(0, 400)} | stdout: ${r.stdout.slice(0, 400)}`);
    } else {
      let parsed;
      try { parsed = JSON.parse(r.stdout); } catch (e) { fail(`stdout not JSON`, `parse error: ${e.message} | stdout: ${r.stdout.slice(0, 400)}`); }
      if (parsed?.ok === true) ok('--json emitted ok:true');
      else fail(`json result not ok: ${r.stdout}`);

      if (parsed?.agents?.includes('openclaw') && parsed?.agents?.includes('hermes')) {
        ok('json reports openclaw + hermes agents');
      } else fail(`json agents wrong: ${JSON.stringify(parsed?.agents)}`);

      if (await exists(path.join(target, '.openclaw/rules.md'))) ok('.openclaw/rules.md written');
      else fail('.openclaw/rules.md missing');
      if (await exists(path.join(target, '.hermes/agent.md'))) ok('.hermes/agent.md written');
      else fail('.hermes/agent.md missing');

      const oc = await readFile(path.join(target, '.openclaw/rules.md'), 'utf8');
      if (oc.includes(KARPATHY_GIST)) ok('Karpathy URL propagated to .openclaw/rules.md');
      else fail('Karpathy URL missing from .openclaw/rules.md');
    }
  } finally {
    await cleanup(target);
  }
}

// ---------- [3/5] minimal install ----------
console.log('\n[3/5] CLI subprocess: --no-mcp --no-site --no-recipes');
{
  const target = path.join(tmpdir(), `opc-smoke-min-${Date.now()}`);
  try {
    const r = await runCli([target, '--yes', '--agents=codex', '--no-mcp', '--no-site', '--no-recipes', '--no-git', '--json']);
    if (r.code !== 0) fail(`exit ${r.code}: ${r.stderr}`);
    else {
      if (!(await exists(path.join(target, 'mcp')))) ok('mcp/ NOT scaffolded');
      else fail('mcp/ should be skipped');
      if (!(await exists(path.join(target, 'site')))) ok('site/ NOT scaffolded');
      else fail('site/ should be skipped');
      if (!(await exists(path.join(target, 'recipes')))) ok('recipes/ NOT scaffolded');
      else fail('recipes/ should be skipped');
      if (!(await exists(path.join(target, '.github/workflows/wiki-publish.yml')))) ok('publish workflow NOT scaffolded');
      else fail('publish workflow should be skipped without --site');
      if (await exists(path.join(target, 'AGENTS.md'))) ok('AGENTS.md written for codex');
      else fail('AGENTS.md missing');
    }
  } finally {
    await cleanup(target);
  }
}

// ---------- [4/5] custom domains ----------
console.log('\n[4/5] CLI subprocess: --domains=ai,bio,papers');
{
  const target = path.join(tmpdir(), `opc-smoke-dom-${Date.now()}`);
  try {
    const r = await runCli([target, '--yes', '--agents=cursor', '--domains=ai,bio,papers', '--no-git', '--json']);
    if (r.code !== 0) fail(`exit ${r.code}: ${r.stderr}`);
    else {
      if (await exists(path.join(target, 'wiki/ai/_index.md'))) ok('wiki/ai/_index.md');
      else fail('wiki/ai missing');
      if (await exists(path.join(target, 'wiki/bio/_index.md'))) ok('wiki/bio/_index.md');
      else fail('wiki/bio missing');
      if (await exists(path.join(target, 'wiki/papers/_index.md'))) ok('wiki/papers/_index.md');
      else fail('wiki/papers missing');
      if (await exists(path.join(target, '.cursor/rules/main.mdc'))) ok('cursor mdc written');
      else fail('cursor mdc missing');
    }
  } finally {
    await cleanup(target);
  }
}

// ---------- [5/5] error paths ----------
console.log('\n[5/5] error paths — each must exit non-zero with a useful message');

// 5a. Invalid agent key
{
  const target = path.join(tmpdir(), `opc-smoke-err-agent-${Date.now()}`);
  try {
    const r = await runCli([target, '--yes', '--agents=bogus']);
    if (r.code !== 0) ok(`--agents=bogus exits non-zero (${r.code})`);
    else fail(`--agents=bogus should fail, exited 0`);
    if (r.stderr.toLowerCase().includes('unknown agent')) ok('stderr mentions "unknown agent"');
    else fail(`stderr lacks "unknown agent": ${r.stderr.slice(0, 200)}`);
    if (!(await exists(target))) ok('no target dir created on invalid agent');
    else fail('target dir should NOT exist after invalid flag');
  } finally {
    await cleanup(target);
  }
}

// 5b. Target dir already populated
{
  const target = path.join(tmpdir(), `opc-smoke-err-populated-${Date.now()}`);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, 'existing.txt'), 'pre-existing content\n');
  try {
    const r = await runCli([target, '--yes', '--no-git', '--json']);
    if (r.code !== 0) ok(`populated target exits non-zero (${r.code})`);
    else fail('populated target should fail');
    let parsed = null;
    try { parsed = JSON.parse(r.stdout); } catch {}
    if (parsed?.ok === false && typeof parsed.error === 'string') {
      ok('--json emits {ok:false, error: string} on populated target');
    } else {
      fail(`expected {ok:false, error} JSON; got: ${r.stdout.slice(0, 200)}`);
    }
    if (parsed?.error?.toLowerCase()?.includes('not empty')) ok('error mentions "not empty"');
    else fail(`error should mention "not empty": ${parsed?.error}`);
  } finally {
    await cleanup(target);
  }
}

// 5c. Empty domains list (all commas)
{
  const target = path.join(tmpdir(), `opc-smoke-err-emptydoms-${Date.now()}`);
  try {
    const r = await runCli([target, '--yes', '--domains=,,', '--no-git', '--json']);
    if (r.code !== 0) ok(`empty --domains exits non-zero (${r.code})`);
    else fail('empty --domains should fail');
    let parsed = null;
    try { parsed = JSON.parse(r.stdout); } catch {}
    if (parsed?.ok === false) ok('--json emits ok:false on empty domains');
    else fail(`expected {ok:false}; got: ${r.stdout.slice(0, 200)}`);
    if (parsed?.error?.toLowerCase()?.includes('domain')) ok('error mentions domains');
    else fail(`error should mention domains: ${parsed?.error}`);
  } finally {
    await cleanup(target);
  }
}

// 5d. Unknown flag
{
  const target = path.join(tmpdir(), `opc-smoke-err-unknown-${Date.now()}`);
  try {
    const r = await runCli([target, '--yes', '--bogus-flag']);
    if (r.code !== 0) ok(`--bogus-flag exits non-zero (${r.code})`);
    else fail('unknown flag should fail');
    if (r.stderr.toLowerCase().includes('unknown flag')) ok('stderr mentions "unknown flag"');
    else fail(`stderr lacks "unknown flag": ${r.stderr.slice(0, 200)}`);
    if (!(await exists(target))) ok('no target dir created on unknown flag');
    else fail('target dir should NOT exist after unknown flag');
  } finally {
    await cleanup(target);
  }
}

// ---------- Repo-level Karpathy attribution regression ----------
console.log('\n[*] repo-level Karpathy attribution regression');
{
  const repoFiles = [
    'INSPIRATION.md', 'README.md', 'llms.txt', 'agents.json',
    'docs/INSTALL-FOR-AGENTS.md',
    'templates/agent-rules/main.md.tpl',
    'templates/index.md.tpl', 'templates/USAGE.md.tpl',
    'templates/wiki/_index.md.tpl', 'templates/docs/REMOTE-ACCESS.md',
  ];
  for (const f of repoFiles) {
    const content = await readFile(path.join(repoRoot, f), 'utf8');
    if (content.includes(KARPATHY_GIST)) ok(`${f} cites Karpathy gist`);
    else fail(`${f} missing Karpathy gist URL`);
  }
}

// ---------- README duplicate-heading regression ----------
console.log('\n[*] README structural regression');
{
  const readme = await readFile(path.join(repoRoot, 'README.md'), 'utf8');
  const cliFlagHeadings = readme.match(/^## CLI flags\s*$/gm) ?? [];
  if (cliFlagHeadings.length === 1) ok('exactly one "## CLI flags" heading in README');
  else fail(`README has ${cliFlagHeadings.length} "## CLI flags" headings (expected 1)`);
}

// ---------- Done ----------
if (failed > 0) {
  console.log(`\n[smoke] FAILED with ${failed} issue(s)`);
  process.exit(1);
}
console.log('\n[smoke] ALL CHECKS PASSED');

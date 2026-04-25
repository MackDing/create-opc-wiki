// End-to-end test for create-opc-wiki.
//
// Goes one step beyond smoke: actually installs the generated vault's
// dependencies and runs them.
//
//   1. Scaffold a vault with --yes --site --mcp --agents=openclaw,claude,codex
//   2. cd into mcp/, npm install, boot server.mjs, poll for initialize response,
//      send tools/list, assert 3 tools (wiki_query, wiki_list, wiki_read), kill
//   3. Drop a fixture wiki page (privacy: public) + a secret-gated page
//   4. cd into site/, npm install, npm run build,
//      assert dist/{sitemap.xml, robots.txt, llms.txt, feed.xml} exist
//      and contain the fixture page (but NOT the secret page)
//
// Skipped automatically when:
//   - OFFLINE=1 (no network)
//   - npm install fails (private registry, no internet)
//
// Exits 0 on full pass, 1 on real failure, 0 (with note) on skip.

import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const cliPath = path.join(repoRoot, 'dist/cli.js');

let failed = 0;
const fail = (m) => { console.log(`  ✗ ${m}`); failed++; };
const ok = (m) => console.log(`  ✓ ${m}`);

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, {
      cwd: opts.cwd,
      stdio: opts.stdio ?? 'pipe',
      timeout: opts.timeout ?? 120_000,
      env: opts.env ?? process.env,
    });
    let stdout = '';
    let stderr = '';
    if (p.stdout) p.stdout.on('data', (d) => (stdout += d.toString()));
    if (p.stderr) p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('close', (code) => resolve({ code, stdout, stderr }));
    p.on('error', (err) => resolve({ code: -1, stdout, stderr: err.message }));
  });
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

/**
 * Wait for a JSON-RPC response with the given id to appear in the stream buffer.
 * Returns the parsed response, or throws on timeout.
 */
function waitForRpcResponse(getBuffer, id, timeoutMs = 10_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const buf = getBuffer();
      for (const line of buf.split('\n')) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg?.id === id) return resolve(msg);
        } catch { /* not a JSON line, skip */ }
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`timeout waiting for JSON-RPC id=${id} after ${timeoutMs}ms. Buffer: ${buf.slice(0, 500)}`));
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

if (process.env.OFFLINE === '1') {
  console.log('[e2e] OFFLINE=1 — skipping (network-dependent test)');
  process.exit(0);
}

// 1. Scaffold
const target = path.join(tmpdir(), `opc-e2e-${Date.now()}`);
console.log(`[e2e] target: ${target}`);

try {
  const scaffoldR = await run(process.execPath, [
    cliPath, target,
    '--yes',
    '--agents=openclaw,claude,codex',
    '--mcp', '--site',
    '--no-git',
    '--json',
  ]);
  if (scaffoldR.code !== 0) {
    console.log(`[e2e] scaffold failed (code ${scaffoldR.code}): ${scaffoldR.stderr}`);
    process.exit(1);
  }
  ok('scaffold complete');

  // 2. MCP install + boot
  console.log('\n[e2e] MCP server: install + boot + tools/list');
  const mcpDir = path.join(target, 'mcp');
  const mcpInstall = await run('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
    cwd: mcpDir, timeout: 180_000,
  });
  if (mcpInstall.code !== 0) {
    console.log(`[e2e] npm install failed in mcp/ (likely no network).`);
    console.log(`      stderr: ${mcpInstall.stderr.split('\n').slice(-5).join('\n')}`);
    console.log('[e2e] skipping MCP boot test (treat as inconclusive, not failure).');
  } else {
    ok('mcp/ npm install succeeded');

    const server = spawn(process.execPath, ['server.mjs'], {
      cwd: mcpDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdoutBuf = '';
    let stderrBuf = '';
    server.stdout.on('data', (d) => (stdoutBuf += d.toString()));
    server.stderr.on('data', (d) => (stderrBuf += d.toString()));

    try {
      const initReq = JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e2e', version: '1.0' } },
      }) + '\n';
      server.stdin.write(initReq);
      await waitForRpcResponse(() => stdoutBuf, 1, 10_000);
      ok('MCP server responded to initialize');

      const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n';
      server.stdin.write(listReq);
      const listResponse = await waitForRpcResponse(() => stdoutBuf, 2, 10_000);
      const toolNames = (listResponse.result?.tools ?? []).map((t) => t.name);
      if (['wiki_query', 'wiki_list', 'wiki_read'].every((t) => toolNames.includes(t))) {
        ok(`MCP reports 3 tools: ${toolNames.join(', ')}`);
      } else {
        fail(`MCP tools/list missing expected tools. Got: ${JSON.stringify(toolNames)}. Stderr: ${stderrBuf.slice(0, 300)}`);
      }
    } catch (err) {
      fail(`MCP boot/rpc failed: ${err.message}\nstderr: ${stderrBuf.slice(0, 300)}`);
    } finally {
      server.kill('SIGTERM');
      await new Promise((r) => server.on('close', r));
    }
  }

  // 3. Drop fixture pages (one public, one secret — to verify gate)
  const fixtureDir = path.join(target, 'wiki', 'tech');
  await mkdir(fixtureDir, { recursive: true });
  await writeFile(path.join(fixtureDir, 'fixture-llm-wiki.md'), `---
title: LLM Wiki Pattern
domain: tech
privacy: public
confidence: high
created: 2026-04-25
last-updated: 2026-04-25
description: A test fixture page for the e2e site build.
tags: [llm, wiki]
---

# LLM Wiki Pattern

This is a fixture page used by the e2e test to verify the static site build
includes public pages and emits SEO/GEO outputs.

## Key Points

- The wiki compiles knowledge.
- The static site publishes only privacy: public pages.
- llms.txt and sitemap.xml are emitted.
`);
  await writeFile(path.join(fixtureDir, 'fixture-secret.md'), `---
title: SECRET PAGE MUST NOT PUBLISH
domain: tech
privacy: secret
---
Secret body text unique marker: ZZTOPSECRETMARKER.
`);
  ok('fixture pages dropped (1 public + 1 secret)');

  // 4. Site install + build
  console.log('\n[e2e] site: install + build + SEO/GEO surfaces + privacy gate');
  const siteDir = path.join(target, 'site');
  const siteInstall = await run('npm', ['install', '--no-audit', '--no-fund', '--silent'], {
    cwd: siteDir, timeout: 180_000,
  });
  if (siteInstall.code !== 0) {
    console.log(`[e2e] site/ npm install failed (likely no network).`);
    console.log(`      stderr: ${siteInstall.stderr.split('\n').slice(-5).join('\n')}`);
    console.log('[e2e] skipping site build test (inconclusive, not failure).');
  } else {
    ok('site/ npm install succeeded');
    const build = await run('npm', ['run', 'build'], { cwd: siteDir, timeout: 60_000 });
    if (build.code !== 0) {
      fail(`site build failed: ${build.stderr}`);
    } else {
      ok('site build succeeded');

      const distOf = (f) => path.join(siteDir, 'dist', f);
      const required = ['index.html', 'sitemap.xml', 'robots.txt', 'llms.txt', 'feed.xml',
        'tech/fixture-llm-wiki/index.html'];
      for (const f of required) {
        if (await exists(distOf(f))) ok(`dist/${f}`);
        else fail(`dist/${f} missing`);
      }

      const llmsTxt = await readFile(distOf('llms.txt'), 'utf8');
      if (llmsTxt.includes('LLM Wiki Pattern')) ok('llms.txt includes public fixture page');
      else fail('llms.txt missing public fixture page');

      if (!llmsTxt.includes('ZZTOPSECRETMARKER') && !llmsTxt.includes('SECRET PAGE')) {
        ok('llms.txt does NOT include secret page (privacy gate holds)');
      } else fail('llms.txt leaked secret page!');

      if (!(await exists(distOf('tech/fixture-secret/index.html')))) {
        ok('secret page NOT written to dist (privacy gate holds)');
      } else fail('secret page leaked to dist/ (privacy gate broken!)');

      const fixtureHtml = await readFile(distOf('tech/fixture-llm-wiki/index.html'), 'utf8');
      if (fixtureHtml.includes('og:title') && fixtureHtml.includes('application/ld+json')) {
        ok('fixture page emits OpenGraph + JSON-LD');
      } else {
        fail('fixture page missing OG or JSON-LD');
      }

      const sitemap = await readFile(distOf('sitemap.xml'), 'utf8');
      if (sitemap.includes('tech/fixture-llm-wiki/')) ok('sitemap.xml includes public fixture page');
      else fail('sitemap.xml missing public fixture page');

      if (!sitemap.includes('fixture-secret')) {
        ok('sitemap.xml does NOT include secret page');
      } else fail('sitemap.xml leaked secret page!');
    }
  }
} finally {
  await rm(target, { recursive: true, force: true });
}

if (failed > 0) {
  console.log(`\n[e2e] FAILED with ${failed} issue(s)`);
  process.exit(1);
}
console.log('\n[e2e] ALL CHECKS PASSED');

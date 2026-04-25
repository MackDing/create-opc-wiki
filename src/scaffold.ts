// Scaffold logic. Render templates → write a working vault to disk.

import { mkdir, copyFile, writeFile, readFile, readdir, stat, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import Mustache from 'mustache';
import { findAgentByKey } from './agents.js';
import type { ScaffoldAnswers } from './prompts.js';

// Disable HTML escaping — wiki templates contain markdown with `<`/`&` that should pass through verbatim.
Mustache.escape = (text) => text;

interface RenderView {
  projectName: string;
  today: string;
  firstDomain: string;
  domains: Array<{ key: string; label: string; description: string; examples: string }>;
  agents: Array<{ key: string; label: string; rulesPath: string }>;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else {
      await copyFile(s, d);
    }
  }
}

async function renderTpl(
  templatesDir: string,
  tplRel: string,
  outAbs: string,
  view: RenderView,
): Promise<void> {
  const tpl = await readFile(path.join(templatesDir, tplRel), 'utf-8');
  const out = Mustache.render(tpl, view);
  await mkdir(path.dirname(outAbs), { recursive: true });
  await writeFile(outAbs, out);
}

async function copyOne(
  templatesDir: string,
  rel: string,
  outAbs: string,
): Promise<void> {
  await mkdir(path.dirname(outAbs), { recursive: true });
  await copyFile(path.join(templatesDir, rel), outAbs);
}

export interface ScaffoldResult {
  filesWritten: number;
  dirsCreated: number;
  skipped: string[];
}

export async function scaffold(
  templatesDir: string,
  targetDir: string,
  answers: ScaffoldAnswers,
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = { filesWritten: 0, dirsCreated: 0, skipped: [] };

  // Pre-flight: the target dir must be empty (or non-existent). Refuse to overwrite a populated dir.
  if (existsSync(targetDir)) {
    const entries = await readdir(targetDir);
    const visible = entries.filter((n) => !n.startsWith('.'));
    if (visible.length > 0) {
      throw new Error(
        `Target directory '${targetDir}' is not empty. Refusing to overwrite. Pick another name or remove it.`,
      );
    }
  }
  await mkdir(targetDir, { recursive: true });
  result.dirsCreated++;

  const today = new Date().toISOString().slice(0, 10);
  const view: RenderView = {
    projectName: answers.projectName,
    today,
    firstDomain: answers.domains[0]?.key ?? 'general',
    domains: answers.domains.map((d) => ({
      key: d.key,
      label: d.label,
      description: d.description,
      examples: d.examples,
    })),
    agents: answers.agents.map((k) => {
      const t = findAgentByKey(k);
      return { key: t.key, label: t.label, rulesPath: t.rulesPath };
    }),
  };

  // 1. agent-rules/main.md (rendered) + .targets file
  await renderTpl(
    templatesDir,
    'agent-rules/main.md.tpl',
    path.join(targetDir, 'agent-rules/main.md'),
    view,
  );
  result.filesWritten++;
  await writeFile(
    path.join(targetDir, 'agent-rules/.targets'),
    answers.agents.join('\n') + '\n',
  );
  result.filesWritten++;

  // 2. Initial sync: write rules to each enabled agent target.
  const renderedMain = await readFile(
    path.join(targetDir, 'agent-rules/main.md'),
    'utf-8',
  );
  for (const agentKey of answers.agents) {
    const target = findAgentByKey(agentKey);
    const outAbs = path.join(targetDir, target.rulesPath);
    await mkdir(path.dirname(outAbs), { recursive: true });
    const content = (target.prefix ?? '') + renderedMain;
    await writeFile(outAbs, content);
    result.filesWritten++;
  }

  // 3. skills/ — copy three skill files as-is
  await copyDir(path.join(templatesDir, 'skills'), path.join(targetDir, 'skills'));
  result.filesWritten += 3;
  result.dirsCreated++;

  // 4. USAGE.md, index.md, log.md, wiki/_index.md
  await renderTpl(templatesDir, 'USAGE.md.tpl', path.join(targetDir, 'USAGE.md'), view);
  result.filesWritten++;
  await renderTpl(templatesDir, 'index.md.tpl', path.join(targetDir, 'index.md'), view);
  result.filesWritten++;
  await copyOne(templatesDir, 'log.md', path.join(targetDir, 'log.md'));
  result.filesWritten++;
  await renderTpl(
    templatesDir,
    'wiki/_index.md.tpl',
    path.join(targetDir, 'wiki/_index.md'),
    view,
  );
  result.filesWritten++;

  // 5. Per-domain index pages
  const domainTpl = await readFile(
    path.join(templatesDir, 'wiki/_domain_/_index.md.tpl'),
    'utf-8',
  );
  for (const domain of answers.domains) {
    const dir = path.join(targetDir, 'wiki', domain.key);
    await mkdir(dir, { recursive: true });
    result.dirsCreated++;
    const content = Mustache.render(domainTpl, domain);
    await writeFile(path.join(dir, '_index.md'), content);
    result.filesWritten++;
  }

  // 6. raw/ stubs — copy directory
  await copyDir(path.join(templatesDir, 'raw'), path.join(targetDir, 'raw'));
  result.dirsCreated += 4;
  result.filesWritten += 4;

  // 7. .obsidian/ defaults
  await copyDir(path.join(templatesDir, '.obsidian'), path.join(targetDir, '.obsidian'));
  result.filesWritten += 2;
  result.dirsCreated++;

  // 8. scripts/ — sync-agent-rules.sh
  await copyDir(path.join(templatesDir, 'scripts'), path.join(targetDir, 'scripts'));
  // Make sync script executable
  const syncScript = path.join(targetDir, 'scripts/sync-agent-rules.sh');
  if (existsSync(syncScript)) {
    await chmod(syncScript, 0o755);
  }
  result.filesWritten++;
  result.dirsCreated++;

  // 9. Optional: docs/REMOTE-ACCESS.md
  if (answers.includeRemoteDocs) {
    await copyOne(
      templatesDir,
      'docs/REMOTE-ACCESS.md',
      path.join(targetDir, 'docs/REMOTE-ACCESS.md'),
    );
    result.filesWritten++;
    result.dirsCreated++;
  }

  // 10. Extras — recipes / mcp / site.
  for (const extra of answers.extras) {
    const src = path.join(templatesDir, extra);
    if (!existsSync(src)) {
      result.skipped.push(`${extra} (template not bundled in this build)`);
      continue;
    }
    if (extra === 'mcp' || extra === 'recipes' || extra === 'site') {
      await copyDir(src, path.join(targetDir, extra));
      result.dirsCreated++;
      // mcp + site contain .tpl files; render each.
      await renderTplsInPlace(path.join(targetDir, extra), view);
    }
  }

  // 10b. If the site extra is enabled, drop the GitHub Pages workflow at the
  // vault root .github/workflows/ (not inside site/), where Actions expects it.
  if (answers.extras.includes('site')) {
    const wfSrc = path.join(templatesDir, 'workflows', 'wiki-publish.yml');
    if (existsSync(wfSrc)) {
      const wfDest = path.join(targetDir, '.github', 'workflows', 'wiki-publish.yml');
      await mkdir(path.dirname(wfDest), { recursive: true });
      await copyFile(wfSrc, wfDest);
      result.filesWritten++;
    }
  }

  // 11. Top-level README for the generated vault
  await writeVaultReadme(targetDir, answers, view);
  result.filesWritten++;

  // 12. .gitignore (sensible defaults)
  await writeFile(
    path.join(targetDir, '.gitignore'),
    [
      'node_modules/',
      'dist/',
      '.DS_Store',
      '# Astro build artifacts',
      'astro/dist/',
      'astro/.astro/',
      '# Local environment',
      '.env',
      '.env.local',
    ].join('\n') + '\n',
  );
  result.filesWritten++;

  // 13. Optional: git init + initial commit
  if (answers.initGit) {
    await runGitInit(targetDir);
  }

  return result;
}

async function renderTplsInPlace(dir: string, view: RenderView): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await renderTplsInPlace(full, view);
    } else if (entry.name.endsWith('.tpl')) {
      const tpl = await readFile(full, 'utf-8');
      const out = Mustache.render(tpl, view);
      const outPath = full.slice(0, -'.tpl'.length);
      await writeFile(outPath, out);
      // Remove the .tpl placeholder by overwriting with rendered content next door.
      // Keep .tpl in source templates/, but in generated vault we want only the rendered output.
      const fs = await import('node:fs/promises');
      await fs.unlink(full).catch(() => undefined);
    }
  }
}

async function writeVaultReadme(
  targetDir: string,
  answers: ScaffoldAnswers,
  view: RenderView,
): Promise<void> {
  const lines = [
    `# ${answers.projectName}`,
    '',
    '> Personal wiki built with [create-opc-wiki](https://github.com/MackDing/create-opc-wiki).',
    '',
    '## Quick start',
    '',
    '```bash',
    '# Open in Obsidian: File → Open Vault → this folder',
    '',
    '# Or run your AI agent from this directory:',
    `cd ${answers.projectName}`,
    `# Then run /wiki-ingest, /wiki-query, /wiki-lint`,
    '```',
    '',
    '## Domains',
    '',
    ...answers.domains.map((d) => `- \`${d.key}/\` — ${d.description}`),
    '',
    '## Configured agents',
    '',
    ...view.agents.map((a) => `- ${a.label} → \`${a.rulesPath}\``),
    '',
    '## Files of interest',
    '',
    '- [`agent-rules/main.md`](./agent-rules/main.md) — single source of truth for agent rules',
    '- [`USAGE.md`](./USAGE.md) — full usage guide',
    '- [`scripts/sync-agent-rules.sh`](./scripts/sync-agent-rules.sh) — propagate main.md to all agent files',
    '',
    'See [`USAGE.md`](./USAGE.md) for the full workflow.',
    '',
  ];
  await writeFile(path.join(targetDir, 'README.md'), lines.join('\n'));
}

function runGitInit(targetDir: string): Promise<void> {
  return new Promise((resolve) => {
    const run = (cmd: string, args: string[]): Promise<number> =>
      new Promise((res) => {
        const proc = spawn(cmd, args, { cwd: targetDir, stdio: 'ignore' });
        proc.on('close', (code) => res(code ?? 1));
        proc.on('error', () => res(1));
      });

    (async () => {
      const init = await run('git', ['init', '-b', 'main']);
      if (init !== 0) {
        // If git is missing or fails, just skip — not a hard error.
        resolve();
        return;
      }
      await run('git', ['add', '.']);
      await run('git', [
        'commit',
        '-m',
        'init: bootstrap personal wiki from create-opc-wiki',
        '--no-gpg-sign',
      ]);
      resolve();
    })();
  });
}

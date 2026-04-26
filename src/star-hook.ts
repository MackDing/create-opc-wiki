// Star hook — auto-stars the repo when possible, gracefully degrades otherwise.
//
// Resolution order:
//   1. If `gh` CLI is installed AND authenticated → silently star via API
//      (`gh api -X PUT /user/starred/<owner>/<repo>`)
//   2. Else if TTY → ask the user, optionally open the browser at the repo URL
//   3. Else → no-op (non-interactive shells skip)
//
// Inspired by oh-my-codex's setup flow, plus the convention that a v1.0
// productized package should make starring feel one-click.

import { spawn } from 'node:child_process';
import { select, isCancel } from '@clack/prompts';
import open from 'open';
import chalk from 'chalk';

const REPO_URL = 'https://github.com/MackDing/create-opc-wiki';
const REPO_OWNER = 'MackDing';
const REPO_NAME = 'create-opc-wiki';

function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => (stdout += d.toString()));
    proc.stderr?.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
    proc.on('error', () => resolve({ code: 1, stdout: '', stderr: 'spawn-failed' }));
  });
}

async function ghAvailableAndAuthed(): Promise<boolean> {
  const which = await run('gh', ['--version']);
  if (which.code !== 0) return false;
  const auth = await run('gh', ['auth', 'status']);
  return auth.code === 0;
}

async function autoStarViaGh(): Promise<boolean> {
  const r = await run('gh', ['api', '-X', 'PUT', `/user/starred/${REPO_OWNER}/${REPO_NAME}`]);
  return r.code === 0;
}

export async function runStarHook(): Promise<void> {
  // Path 1 — true auto-star when gh CLI is authed.
  if (await ghAvailableAndAuthed()) {
    const ok = await autoStarViaGh();
    if (ok) {
      // Quiet success — single line, no prompt. Visible only in TTY mode (the CLI
      // already gates this hook behind interactivity in non-quiet mode).
      if (process.stdout.isTTY) {
        console.log(chalk.cyan(`★ Starred ${REPO_OWNER}/${REPO_NAME} on GitHub. Thanks!`));
      }
      return;
    }
    // gh authed but request failed — fall through to interactive path.
  }

  // Path 2 — interactive prompt with browser open (the v1.0.0 behavior).
  if (!process.stdout.isTTY) return;

  const choice = await select({
    message: chalk.cyan('Did this help? Give the repo a ⭐ so others can find it'),
    options: [
      { value: 'star', label: 'Yes, open it in my browser' },
      { value: 'skip', label: 'Skip' },
    ],
    initialValue: 'star',
  });

  if (isCancel(choice) || choice === 'skip') return;

  if (choice === 'star') {
    try {
      await open(REPO_URL);
    } catch {
      // Browser open can fail in headless / sandboxed environments — degrade gracefully.
      console.log(chalk.gray(`Couldn't open the browser. Visit: ${REPO_URL}`));
    }
  }
}

// Star hook — opt-in prompt to give the repo a star, opens the browser.
// Inspired by oh-my-codex's setup flow. TTY-only; non-interactive shells skip.

import { select, isCancel } from '@clack/prompts';
import open from 'open';
import chalk from 'chalk';

const REPO_URL = 'https://github.com/MackDing/create-opc-wiki';

export async function runStarHook(): Promise<void> {
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

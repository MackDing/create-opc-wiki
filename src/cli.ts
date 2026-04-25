// create-opc-wiki — CLI entry point.
// Wires prompts -> scaffold -> star hook.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { intro, outro, log, note, isCancel, cancel } from '@clack/prompts';
import chalk from 'chalk';
import { runPrompts } from './prompts.js';
import { scaffold } from './scaffold.js';
import { resolveTemplatesDir } from './paths.js';
import { runStarHook } from './star-hook.js';

const VERSION = '0.1.0-alpha.0';

async function main(): Promise<void> {
  const positional = process.argv[2]?.trim();

  console.log();
  intro(chalk.bgCyan.black(` create-opc-wiki v${VERSION} `));

  const answers = await runPrompts(positional);

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, answers.targetDir);

  let result;
  try {
    result = await scaffold(resolveTemplatesDir(), targetDir, answers);
  } catch (err) {
    cancel(`Scaffold failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const skippedNote =
    result.skipped.length > 0
      ? '\n  Skipped: ' + result.skipped.join(', ')
      : '';

  note(
    [
      `${chalk.green('✓')} Wrote ${result.filesWritten} files / ${result.dirsCreated} dirs to ${chalk.bold(targetDir)}`,
      `${chalk.gray('Next steps:')}`,
      `  cd ${answers.projectName}`,
      `  # Open in Obsidian: File → Open Vault → this folder`,
      `  # Or fire up your AI agent and try /wiki-ingest <url>`,
      skippedNote,
    ]
      .filter(Boolean)
      .join('\n'),
    'Done',
  );

  await runStarHook();

  outro(chalk.cyan('Happy compounding. ✨'));
}

main().catch((err) => {
  if (isCancel(err)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  console.error(chalk.red('\nUnexpected error:'), err);
  process.exit(1);
});

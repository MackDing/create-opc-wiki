// create-opc-wiki — CLI entry point.
// Wires flags -> answer resolution -> scaffold -> star hook.

import path from 'node:path';
import { intro, outro, log, note, isCancel, cancel } from '@clack/prompts';
import chalk from 'chalk';
import { parseArgs, isNonInteractive } from './flags.js';
import { resolveAnswers } from './prompts.js';
import { scaffold } from './scaffold.js';
import { resolveTemplatesDir } from './paths.js';
import { runStarHook } from './star-hook.js';

const VERSION = '1.0.0';

async function main(): Promise<void> {
  process.env.OPC_WIKI_VERSION = VERSION;

  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify({ ok: false, error: msg }));
    } else {
      console.error(chalk.red(msg));
    }
    process.exit(2);
  }
  const { flags, positional } = parsed;
  const quiet = flags.quiet || flags.json || !process.stdout.isTTY;

  if (!quiet) {
    console.log();
    intro(chalk.bgCyan.black(` create-opc-wiki v${VERSION} `));
  }

  let answers;
  try {
    answers = await resolveAnswers(flags, positional[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (flags.json) {
      console.log(JSON.stringify({ ok: false, error: msg }));
    } else {
      cancel(msg);
    }
    process.exit(2);
  }

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, answers.targetDir);

  let result;
  try {
    result = await scaffold(resolveTemplatesDir(), targetDir, answers);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (flags.json) {
      console.log(JSON.stringify({ ok: false, error: msg }));
    } else {
      cancel(`Scaffold failed: ${msg}`);
    }
    process.exit(1);
  }

  if (flags.json) {
    console.log(
      JSON.stringify({
        ok: true,
        target: targetDir,
        files: result.filesWritten,
        dirs: result.dirsCreated,
        skipped: result.skipped,
        agents: answers.agents,
        domains: answers.domains.map((d) => d.key),
        extras: answers.extras,
      }),
    );
    return;
  }

  if (!quiet) {
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

    if (!isNonInteractive(flags)) {
      await runStarHook();
    }

    outro(chalk.cyan('Happy compounding. ✨'));
  } else {
    // Quiet mode: one-line status to stderr so stdout stays clean.
    process.stderr.write(
      `create-opc-wiki: wrote ${result.filesWritten} files to ${targetDir}\n`,
    );
  }
}

main().catch((err) => {
  if (isCancel(err)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  console.error(chalk.red('\nUnexpected error:'), err);
  process.exit(1);
});

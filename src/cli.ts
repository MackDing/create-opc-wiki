// create-opc-wiki — CLI entry point.
// Wires together: prompts -> scaffold -> star hook.
// Implementation comes online over Phase 3-4. This file is the skeleton.

import { intro, outro, cancel, isCancel } from '@clack/prompts';
import chalk from 'chalk';

const VERSION = '0.1.0-alpha.0';

async function main(): Promise<void> {
  console.log();
  intro(chalk.bgCyan.black(` create-opc-wiki v${VERSION} `));

  // TODO Phase 3: collect answers via runPrompts()
  // TODO Phase 3: render templates via runScaffold(answers)
  // TODO Phase 4: ask for ⭐ via runStarHook()

  outro(chalk.gray('Phase 1 bootstrap. Prompts + scaffold land in Phase 3.'));
}

main().catch((err) => {
  if (isCancel(err)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  console.error(chalk.red('\nUnexpected error:'), err);
  process.exit(1);
});

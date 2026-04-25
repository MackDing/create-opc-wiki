// Resolve where templates/ lives at runtime.
// At dev time: project root (../templates from dist/cli.js).
// At install time: same — npm package layout puts templates/ alongside dist/.

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

export function resolveTemplatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // Look upward for a templates/ sibling. Works from dist/cli.js (../templates)
  // and from src/cli.ts at dev time (../templates).
  const candidates = [
    path.resolve(here, '..', 'templates'),
    path.resolve(here, '..', '..', 'templates'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `Cannot locate templates/ directory. Searched: ${candidates.join(', ')}`,
  );
}

// CLI flag parser. No deps — small custom parser so that --no-<flag> works on Node 20.
//
// Supported flags (short forms in parens):
//   --name <string>          project dir name
//   --domains <csv>          comma-separated domain keys
//   --agents <csv>           comma-separated agent keys
//   --mcp / --no-mcp         include MCP server (default true)
//   --site / --no-site       include Astro static site (default true)
//   --recipes / --no-recipes include source recipes (default true)
//   --git / --no-git         git init + first commit (default true)
//   --remote-docs            include docs/REMOTE-ACCESS.md (default false)
//   --yes (-y)               accept all defaults, skip prompts
//   --json                   emit machine-readable result on stdout
//   --quiet                  suppress banner/spinners (auto when non-TTY)
//   --help (-h)              print help and exit
//   --version (-V)           print version and exit
//
// Resolution order at use time: flag > env (OPC_WIKI_*) > prompt (TTY only) > default.

import type { AgentKey } from './agents.js';
import { isAgentKey } from './agents.js';

export interface CliFlags {
  name?: string;
  domains?: string[];
  agents?: AgentKey[];
  mcp?: boolean;
  site?: boolean;
  recipes?: boolean;
  git?: boolean;
  remoteDocs?: boolean;
  yes?: boolean;
  json?: boolean;
  quiet?: boolean;
}

export interface ParsedArgs {
  flags: CliFlags;
  positional: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: CliFlags = {};
  const positional: string[] = [];

  const setAgents = (csv: string): void => {
    const items = csv.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) {
      throw new Error(`--agents cannot be empty (got '${csv}')`);
    }
    for (const key of items) {
      if (!isAgentKey(key)) {
        throw new Error(
          `Unknown agent: '${key}'. Valid: claude, codex, cursor, cursor-legacy, vscode, trae, openclaw, hermes, opencode`,
        );
      }
    }
    flags.agents = items as AgentKey[];
  };

  const setDomains = (csv: string): void => {
    const items = csv.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (items.length === 0) {
      throw new Error(`--domains cannot be empty (got '${csv}')`);
    }
    flags.domains = items;
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;

    if (!a.startsWith('-')) {
      positional.push(a);
      continue;
    }

    // --key=value form
    const eq = a.indexOf('=');
    if (eq > 0 && a.startsWith('--')) {
      const key = a.slice(0, eq);
      const val = a.slice(eq + 1);
      if (key === '--name') { flags.name = val; continue; }
      if (key === '--domains') { setDomains(val); continue; }
      if (key === '--agents') { setAgents(val); continue; }
      throw new Error(`Unknown flag: ${key}`);
    }

    switch (a) {
      case '--yes':
      case '-y':
        flags.yes = true; break;
      case '--json':
        flags.json = true; break;
      case '--quiet':
        flags.quiet = true; break;
      case '--mcp':
        flags.mcp = true; break;
      case '--no-mcp':
        flags.mcp = false; break;
      case '--site':
        flags.site = true; break;
      case '--no-site':
        flags.site = false; break;
      case '--recipes':
        flags.recipes = true; break;
      case '--no-recipes':
        flags.recipes = false; break;
      case '--git':
        flags.git = true; break;
      case '--no-git':
        flags.git = false; break;
      case '--remote-docs':
        flags.remoteDocs = true; break;
      case '--name':
        flags.name = argv[++i]; break;
      case '--domains':
        setDomains(argv[++i] ?? ''); break;
      case '--agents':
        setAgents(argv[++i] ?? ''); break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      case '--version':
      case '-V':
        printVersion();
        process.exit(0);
      default:
        throw new Error(`Unknown flag: ${a}. Try --help.`);
    }
  }

  // Pull defaults from env when flags are absent.
  if (flags.name === undefined && process.env.OPC_WIKI_NAME) {
    flags.name = process.env.OPC_WIKI_NAME;
  }
  if (flags.domains === undefined && process.env.OPC_WIKI_DOMAINS) {
    setDomains(process.env.OPC_WIKI_DOMAINS);
  }
  if (flags.agents === undefined && process.env.OPC_WIKI_AGENTS) {
    setAgents(process.env.OPC_WIKI_AGENTS);
  }
  if (flags.yes === undefined && process.env.OPC_WIKI_YES === '1') {
    flags.yes = true;
  }

  return { flags, positional };
}

/** True when we should NOT prompt the user — flag-only mode. */
export function isNonInteractive(flags: CliFlags): boolean {
  if (flags.yes || flags.json || flags.quiet) return true;
  if (!process.stdout.isTTY) return true;
  return false;
}

function printVersion(): void {
  // VERSION is injected by cli.ts via env at startup; fall back to package.json read.
  console.log(process.env.OPC_WIKI_VERSION ?? '0.0.0');
}

function printHelp(): void {
  console.log(`create-opc-wiki — scaffold a personal LLM wiki (Karpathy pattern)

Usage:
  npx create-opc-wiki [name] [options]
  npm create opc-wiki -- [name] [options]

Options:
  --name <string>          project dir name (or first positional arg)
  --domains <csv>          knowledge domains (default: tech,finance,reading,growth,insights)
  --agents <csv>           AI agents that read the wiki rules
                           (claude,codex,cursor,cursor-legacy,vscode,trae,openclaw,hermes,opencode)
                           default: claude,codex,cursor
  --mcp / --no-mcp         include MCP server (default: yes)
  --site / --no-site       include Astro static site target (default: yes)
  --recipes / --no-recipes include source ingest recipes (default: yes)
  --git / --no-git         git init + first commit (default: yes)
  --remote-docs            include docs/REMOTE-ACCESS.md (default: no)
  -y, --yes                accept all defaults, no prompts
  --json                   emit { target, files, agents } JSON on stdout (implies --quiet)
  --quiet                  no banner / no star hook (auto when non-TTY)
  -V, --version            print version
  -h, --help               print this help

Examples:
  # Fully interactive (default)
  npx create-opc-wiki

  # Zero-prompt install for an IM agent (OpenClaw / Hermes / Codex)
  npx create-opc-wiki my-wiki --yes --agents=openclaw,claude

  # Custom domains, no static site
  npx create-opc-wiki research --yes --domains=ai,bio,papers --no-site

Inspired by Andrej Karpathy's "LLM Wiki" gist:
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
`);
}

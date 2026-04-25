// Answer resolution. Combines flags / env / interactive prompts / defaults.

import {
  text,
  multiselect,
  confirm,
  isCancel,
  cancel,
} from '@clack/prompts';
import {
  DEFAULT_DOMAINS,
  ADDITIONAL_DOMAIN_CATALOG,
  type Domain,
} from './domains.js';
import { AGENT_TARGETS, type AgentKey } from './agents.js';
import type { CliFlags } from './flags.js';
import { isNonInteractive } from './flags.js';

export type ExtraKey = 'mcp' | 'recipes' | 'site';

export interface ScaffoldAnswers {
  projectName: string;
  targetDir: string;
  domains: Domain[];
  agents: AgentKey[];
  extras: ExtraKey[];
  includeRemoteDocs: boolean;
  initGit: boolean;
}

const PROJECT_NAME_RE = /^[a-z0-9][a-z0-9._/-]*$/i;
const DEFAULT_AGENTS: AgentKey[] = ['claude', 'codex', 'cursor'];

function abortIfCancelled<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  return value;
}

function resolveDomains(keys: string[]): Domain[] {
  const all = [...DEFAULT_DOMAINS, ...ADDITIONAL_DOMAIN_CATALOG];
  const out: Domain[] = [];
  for (const key of keys) {
    const k = key.toLowerCase();
    const found = all.find((d) => d.key === k);
    if (found) {
      out.push(found);
    } else if (/^[a-z][a-z0-9-]*$/.test(k)) {
      out.push({
        key: k,
        label: k,
        description: `Custom domain: ${k}`,
        examples: '(add examples here)',
      });
    }
  }
  return out;
}

/**
 * Resolve a complete ScaffoldAnswers from flags, env, prompts, and defaults.
 * Non-interactive (--yes, --json, non-TTY): use defaults for any field not
 * supplied by flag/env. Interactive: prompt only for fields not supplied.
 */
export async function resolveAnswers(
  flags: CliFlags,
  positional?: string,
): Promise<ScaffoldAnswers> {
  const nonInteractive = isNonInteractive(flags);

  // Project name
  let projectName: string;
  const nameFromInput = flags.name ?? positional;
  if (nameFromInput) {
    if (!PROJECT_NAME_RE.test(nameFromInput.split('/').pop() ?? nameFromInput)) {
      throw new Error(
        `Invalid project name '${nameFromInput}'. Use letters, digits, dot, dash, underscore.`,
      );
    }
    projectName = nameFromInput;
  } else if (nonInteractive) {
    projectName = 'opc-wiki';
  } else {
    const answer = abortIfCancelled(
      await text({
        message: 'Project name (used as folder + readme heading)',
        placeholder: 'my-wiki',
        defaultValue: 'my-wiki',
        validate(value) {
          if (!value || value.length === 0) return undefined;
          if (!PROJECT_NAME_RE.test(value.split('/').pop() ?? value)) {
            return 'Use letters, digits, dot, dash, underscore.';
          }
          return undefined;
        },
      }),
    );
    projectName = answer || 'my-wiki';
  }

  // Domains
  let domains: Domain[];
  if (flags.domains && flags.domains.length > 0) {
    domains = resolveDomains(flags.domains);
    if (domains.length === 0) {
      throw new Error(`No valid domains in --domains '${flags.domains.join(',')}'`);
    }
  } else if (nonInteractive) {
    domains = [...DEFAULT_DOMAINS];
  } else {
    const domainOptions = [
      ...DEFAULT_DOMAINS.map((d) => ({ value: d.key, label: d.label, hint: d.description })),
      ...ADDITIONAL_DOMAIN_CATALOG.map((d) => ({ value: d.key, label: d.label, hint: d.description })),
    ];
    const domainKeys = abortIfCancelled(
      await multiselect({
        message: 'Knowledge domains (at least 1)',
        options: domainOptions,
        initialValues: DEFAULT_DOMAINS.map((d) => d.key),
        required: true,
      }),
    );
    domains = resolveDomains(domainKeys as string[]);

    const customRaw = abortIfCancelled(
      await text({
        message: 'Additional custom domains (comma-separated, blank to skip)',
        placeholder: 'travel, music',
        defaultValue: '',
      }),
    );
    if (customRaw && customRaw.trim().length > 0) {
      const customKeys = customRaw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && /^[a-z][a-z0-9-]*$/.test(s));
      for (const key of customKeys) {
        if (!domains.some((d) => d.key === key)) {
          domains.push({
            key,
            label: key,
            description: `Custom domain: ${key}`,
            examples: '(add examples here)',
          });
        }
      }
    }
  }

  // Agents
  let agents: AgentKey[];
  if (flags.agents && flags.agents.length > 0) {
    agents = flags.agents;
  } else if (nonInteractive) {
    agents = DEFAULT_AGENTS;
  } else {
    const agentKeys = abortIfCancelled(
      await multiselect({
        message: 'Which AI agents will read your wiki rules? (at least 1)',
        options: AGENT_TARGETS.map((a) => ({
          value: a.key,
          label: a.label,
          hint: a.description,
        })),
        initialValues: DEFAULT_AGENTS,
        required: true,
      }),
    );
    agents = agentKeys as AgentKey[];
  }

  // Dedupe agents by rulesPath (opencode and codex both write AGENTS.md)
  const seenPaths = new Set<string>();
  agents = agents.filter((k) => {
    const target = AGENT_TARGETS.find((a) => a.key === k);
    if (!target) return false;
    if (seenPaths.has(target.rulesPath)) return false;
    seenPaths.add(target.rulesPath);
    return true;
  });

  // Extras
  const extras: ExtraKey[] = [];
  const promptYn = async (msg: string, def: boolean): Promise<boolean> => {
    const r = abortIfCancelled(await confirm({ message: msg, initialValue: def }));
    return Boolean(r);
  };

  const wantMcp =
    flags.mcp ?? (nonInteractive ? true : await promptYn('Include MCP server?', true));
  if (wantMcp) extras.push('mcp');

  const wantRecipes =
    flags.recipes ??
    (nonInteractive ? true : await promptYn('Include source recipes (arXiv/X/YouTube/RSS/podcast)?', true));
  if (wantRecipes) extras.push('recipes');

  const wantSite =
    flags.site ??
    (nonInteractive ? true : await promptYn('Include static site target (SEO/GEO)?', true));
  if (wantSite) extras.push('site');

  const includeRemoteDocs =
    flags.remoteDocs ??
    (nonInteractive ? false : await promptYn('Include docs/REMOTE-ACCESS.md (Caddy + Tailscale ref)?', false));

  const initGit =
    flags.git ??
    (nonInteractive ? true : await promptYn('Initialize git and create the first commit?', true));

  const targetDir = projectName;

  return {
    projectName: projectName.split('/').pop() ?? projectName,
    targetDir,
    domains,
    agents,
    extras,
    includeRemoteDocs,
    initGit,
  };
}

// Backwards-compatible export so existing tests / callers keep working.
export async function runPrompts(positionalName?: string): Promise<ScaffoldAnswers> {
  return resolveAnswers({}, positionalName);
}

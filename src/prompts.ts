// Interactive prompts. Collects ScaffoldAnswers via @clack/prompts.

import {
  text,
  multiselect,
  confirm,
  isCancel,
  cancel,
} from '@clack/prompts';
import { DEFAULT_DOMAINS, ADDITIONAL_DOMAIN_CATALOG, type Domain } from './domains.js';
import { AGENT_TARGETS, type AgentKey } from './agents.js';

export type ExtraKey = 'mcp' | 'recipes' | 'astro';

export interface ScaffoldAnswers {
  projectName: string;
  targetDir: string;
  domains: Domain[];
  agents: AgentKey[];
  extras: ExtraKey[];
  includeRemoteDocs: boolean;
  initGit: boolean;
}

const PROJECT_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/i;

function abortIfCancelled<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  return value;
}

export async function runPrompts(positionalName?: string): Promise<ScaffoldAnswers> {
  // Project name
  let projectName: string;
  if (positionalName && PROJECT_NAME_RE.test(positionalName)) {
    projectName = positionalName;
  } else {
    const answer = abortIfCancelled(
      await text({
        message: 'Project name (used as folder + readme heading)',
        placeholder: 'my-wiki',
        defaultValue: 'my-wiki',
        validate(value) {
          if (!value || value.length === 0) return undefined; // defaultValue kicks in
          if (!PROJECT_NAME_RE.test(value)) {
            return 'Use letters, digits, dot, dash, underscore. Start with letter or digit.';
          }
          return undefined;
        },
      }),
    );
    projectName = answer || 'my-wiki';
  }

  // Domains: default 5 selected, additional catalog as opt-in
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
  const allDomains = [...DEFAULT_DOMAINS, ...ADDITIONAL_DOMAIN_CATALOG];
  const domains: Domain[] = (domainKeys as string[])
    .map((k) => allDomains.find((d) => d.key === k))
    .filter((d): d is Domain => d !== undefined);

  // Custom domains (free text)
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

  // Agent targets
  const agentKeys = abortIfCancelled(
    await multiselect({
      message: 'Which AI coding tools will read your wiki rules? (at least 1)',
      options: AGENT_TARGETS.map((a) => ({
        value: a.key,
        label: a.label,
        hint: a.description,
      })),
      initialValues: ['claude', 'codex'],
      required: true,
    }),
  );
  const agents = agentKeys as AgentKey[];

  // Extras
  const extraKeys = abortIfCancelled(
    await multiselect({
      message: 'Enable extra capabilities (default: all)',
      options: [
        {
          value: 'mcp',
          label: 'MCP server',
          hint: 'Make your wiki queryable by any MCP client (Claude Desktop, Cursor, Codex)',
        },
        {
          value: 'recipes',
          label: 'Source recipes',
          hint: 'arXiv / X / YouTube / RSS / podcast ingest patterns',
        },
        {
          value: 'astro',
          label: 'Static site publishing',
          hint: 'npm run wiki:publish → Astro Starlight site (privacy: public only)',
        },
      ],
      initialValues: ['mcp', 'recipes', 'astro'],
      required: false,
    }),
  );
  const extras = extraKeys as ExtraKey[];

  // Remote access docs
  const includeRemoteDocs = abortIfCancelled(
    await confirm({
      message: 'Include docs/REMOTE-ACCESS.md (Caddy + Tailscale Funnel reference)?',
      initialValue: false,
    }),
  );

  // Init git
  const initGit = abortIfCancelled(
    await confirm({
      message: 'Initialize git and create the first commit?',
      initialValue: true,
    }),
  );

  return {
    projectName,
    targetDir: projectName,
    domains,
    agents,
    extras,
    includeRemoteDocs,
    initGit,
  };
}

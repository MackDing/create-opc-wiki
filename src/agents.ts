// Agent target definitions: which IDE/agent gets which rules file.

export type AgentKey =
  | 'claude'
  | 'codex'
  | 'cursor'
  | 'cursor-legacy'
  | 'vscode'
  | 'trae'
  | 'openclaw'
  | 'hermes'
  | 'opencode';

export interface AgentTarget {
  key: AgentKey;
  label: string;
  description: string;
  /** Path relative to vault root where the rules file is written. */
  rulesPath: string;
  /** Optional content to prepend to the rules file (e.g. mdc frontmatter). */
  prefix?: string;
}

const CURSOR_MDC_PREFIX = `---
description: Personal wiki agent rules
alwaysApply: true
---

`;

export const AGENT_TARGETS: readonly AgentTarget[] = [
  {
    key: 'claude',
    label: 'Claude Code',
    description: 'Anthropic Claude Code CLI — reads CLAUDE.md',
    rulesPath: 'CLAUDE.md',
  },
  {
    key: 'codex',
    label: 'OpenAI Codex CLI',
    description: 'OpenAI Codex CLI — reads AGENTS.md',
    rulesPath: 'AGENTS.md',
  },
  {
    key: 'cursor',
    label: 'Cursor (modern)',
    description: 'Cursor IDE 2025+ — reads .cursor/rules/main.mdc',
    rulesPath: '.cursor/rules/main.mdc',
    prefix: CURSOR_MDC_PREFIX,
  },
  {
    key: 'cursor-legacy',
    label: 'Cursor (legacy)',
    description: 'Cursor IDE legacy — reads .cursorrules',
    rulesPath: '.cursorrules',
  },
  {
    key: 'vscode',
    label: 'VSCode + GitHub Copilot',
    description: 'GitHub Copilot — reads .github/copilot-instructions.md',
    rulesPath: '.github/copilot-instructions.md',
  },
  {
    key: 'trae',
    label: 'Trae IDE',
    description: 'Trae IDE — reads .trae/rules.md',
    rulesPath: '.trae/rules.md',
  },
  {
    key: 'openclaw',
    label: 'OpenClaw agent',
    description: 'OpenClaw IM-based agent — reads .openclaw/rules.md',
    rulesPath: '.openclaw/rules.md',
  },
  {
    key: 'hermes',
    label: 'Hermes-agent',
    description: 'Hermes IM agent — reads .hermes/agent.md',
    rulesPath: '.hermes/agent.md',
  },
  {
    key: 'opencode',
    label: 'OpenCode CLI',
    description: 'OpenCode / Pi — reads AGENTS.md (shares with Codex)',
    rulesPath: 'AGENTS.md',
  },
] as const;

export function findAgentByKey(key: AgentKey): AgentTarget {
  const t = AGENT_TARGETS.find((a) => a.key === key);
  if (!t) throw new Error(`Unknown agent target: ${key}`);
  return t;
}

export function isAgentKey(s: string): s is AgentKey {
  return AGENT_TARGETS.some((a) => a.key === s);
}

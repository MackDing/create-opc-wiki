# Install `create-opc-wiki` from any AI agent (paste-in recipes)

The scaffolder is fully non-interactive when given `--yes`. Any agent that can
spawn a shell command — Claude Code, OpenAI Codex CLI, Cursor, VSCode/Copilot,
OpenClaw (IM), Hermes-agent, OpenCode/Pi — can install a personal LLM wiki
for the user with a single line. Below: per-agent paste-in recipes.

## The universal command

```bash
npx -y create-opc-wiki@latest <path> --yes --agents=<your-agent>[,<more>]
```

Defaults applied: 5 domains (`tech,finance,reading,growth,insights`), MCP server
on, static site target on, recipes on, `git init` run.

## OpenClaw (IM)

Paste this into your OpenClaw chat:

> Please install a personal LLM wiki at `~/wiki` so we can ingest sources and
> build up knowledge over time. Run:
>
> ```
> npx -y create-opc-wiki@latest ~/wiki --yes --agents=openclaw,claude
> ```
>
> Then open `~/wiki`, read `USAGE.md`, and tell me what you found.

The flags `--agents=openclaw` writes the rules to `.openclaw/rules.md` so future
OpenClaw sessions read them automatically.

## Hermes-agent (IM)

> Install an opc-wiki at `~/wiki`:
>
> ```
> npx -y create-opc-wiki@latest ~/wiki --yes --agents=hermes,codex
> ```
>
> Rules will be written to `.hermes/agent.md`. Read `~/wiki/USAGE.md` for the
> next steps.

## Claude Code

```bash
npx -y create-opc-wiki@latest ~/wiki --yes --agents=claude
cd ~/wiki && claude
```

Inside Claude Code: `/wiki-ingest <url-or-file>`.

## OpenAI Codex CLI / OpenCode / Pi

```bash
npx -y create-opc-wiki@latest ~/wiki --yes --agents=codex
cd ~/wiki && codex
```

Codex reads `AGENTS.md`. OpenCode/Pi share the same file (pass
`--agents=opencode` if you only use OpenCode).

## Cursor

```bash
npx -y create-opc-wiki@latest ~/wiki --yes --agents=cursor
cursor ~/wiki
```

The rules land in `.cursor/rules/main.mdc` with `alwaysApply: true`.

## VSCode + GitHub Copilot

```bash
npx -y create-opc-wiki@latest ~/wiki --yes --agents=vscode
code ~/wiki
```

Rules at `.github/copilot-instructions.md` are picked up by Copilot Chat.

## Multi-agent install (most common)

Want one wiki readable by every agent on the machine?

```bash
npx -y create-opc-wiki@latest ~/wiki --yes \
  --agents=claude,codex,cursor,openclaw,hermes,vscode
```

Edit `agent-rules/main.md` then run `./scripts/sync-agent-rules.sh` to
re-propagate.

## Machine-readable install spec

`/agents.json` at the package root and at the docs site root declares the
canonical install command in JSON, for orchestration tools that want a
zero-prompt programmatic install:

```json
{
  "name": "create-opc-wiki",
  "install": { "npx": "npx -y create-opc-wiki@latest --yes" },
  "capabilities": ["scaffold-wiki", "mcp-server", "static-site"]
}
```

## Inspired by

The "LLM Wiki" pattern was proposed by Andrej Karpathy:
<https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>.

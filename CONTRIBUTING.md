# Contributing to `create-opc-wiki`

Thanks for considering a contribution. This package is a scaffolder for
personal LLM wikis on the
[Karpathy pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
Keep contributions aligned with that pattern — simple, composable, no
surprises — and the semver-stable surface in [STABILITY.md](./STABILITY.md).

## Development setup

```bash
git clone https://github.com/MackDing/create-opc-wiki
cd create-opc-wiki
npm install
npm run build
npm run test:smoke   # 60+ assertions, no network required
npm run test:e2e     # real npm install + MCP boot + site build (needs network)
```

Node 20+ required (`engines.node >= 20`).

## Adding a new AI agent rule target

Say you want to add support for a new agent, e.g. `foo-agent` which reads
`.foo/rules.md`.

1. **`src/agents.ts`** — add an entry to `AGENT_TARGETS` and extend `AgentKey`.
2. **`templates/scripts/sync-agent-rules.sh`** — add a `case` branch that
   writes the file.
3. **`docs/INSTALL-FOR-AGENTS.md`** — add a section with the paste-in
   one-liner.
4. **`README.md`** — add a row to the "Install in any AI agent" table.
5. **`agents.json`** — add `foo` to `supported_agents`.
6. **`scripts/smoke-scaffold.mjs`** — add an assertion that the agent's
   file is written when requested.

Run `npm run test:smoke` and `npm run test:e2e`. Both must pass.

## Adding a new source recipe

1. **`templates/recipes/<source>.md`** — new recipe file. Follow the shape
   of existing recipes (arXiv, X, YouTube, RSS, podcast).
2. **`templates/recipes/_index.md`** — add a row.
3. **`templates/agent-rules/main.md.tpl`** — add an example `/wiki-ingest`
   line under "## Recipes".

## Running the CLI locally without publishing

```bash
npm run build
node dist/cli.js /tmp/test --yes --agents=claude
```

Or symlink for repeated runs:

```bash
npm link
create-opc-wiki /tmp/test --yes
npm unlink -g create-opc-wiki
```

## Semver scope

Before changing any of the following, check [STABILITY.md](./STABILITY.md) —
they are under semver and breaking changes need a major bump and a
deprecation window:

- CLI flag names, types, behavior
- Generated file paths in the scaffolded vault
- Frontmatter schema (required fields on wiki pages)
- MCP tool names, parameter schemas, return shapes
- `--json` output shape

Template prose, skill prose, recipe prose, visual design of the generated
site, and internal `dist/api.js` are **not** under semver.

## Tests

- `npm run test:smoke` — fast (no network), runs in every CI job.
- `npm run test:e2e` — slow (real `npm install`), runs in one CI job on
  Ubuntu. Skipped if `OFFLINE=1`.

New code should be covered by at least the smoke test. If you add a
user-facing flag or a generated file path, add an assertion for it.

## Submitting a PR

1. Fork, branch off `main`.
2. Keep the PR focused — one concern per PR.
3. Include a line in `CHANGELOG.md` under `## [Unreleased]` (create the
   section if missing).
4. Fill out the PR template.
5. CI must be green (3 OSes × 2 Node versions for smoke; Ubuntu for e2e).

## Code style

- Prettier-ish default. No config opinions beyond what the existing code
  uses.
- TypeScript strict. No `any` unless genuinely unavoidable.
- Small files. If a source file passes ~300 lines, split it.

## Questions

Open a GitHub issue. For security concerns, see [SECURITY.md](./SECURITY.md).

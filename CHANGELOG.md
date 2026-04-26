# Changelog

All notable changes to `create-opc-wiki` are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [SemVer](https://semver.org/) — see [STABILITY.md](./STABILITY.md)
for the covered surface.

## [1.0.1] — 2026-04-26

### Added

- **ClawHub publication** — `create-opc-wiki` is now an installable OpenClaw skill
  on <https://clawhub.ai>. Run `clawhub install create-opc-wiki` from any OpenClaw
  agent. Skill manifest at `clawhub-skill/SKILL.md`.
- **True auto-star** in `src/star-hook.ts` — when `gh` CLI is installed and
  authenticated, the install hook silently stars `MackDing/create-opc-wiki` via
  `gh api -X PUT /user/starred/...`. Falls back to the v1.0.0 browser-prompt
  behavior on TTY when `gh` isn't available, and to a no-op in non-interactive
  shells. No background network calls without auth, no surprises.

### Changed

- `src/star-hook.ts` rewritten with the resolution order: gh-CLI auto-star → TTY
  prompt → no-op. Previous behavior (browser open) preserved as fallback.

## [1.0.0] — 2026-04-25

First stable release.

### Added

- **Non-interactive CLI** with full flag set: `--yes`, `--json`, `--quiet`,
  `--name`, `--domains`, `--agents`, `--mcp`/`--no-mcp`, `--site`/`--no-site`,
  `--recipes`/`--no-recipes`, `--git`/`--no-git`, `--remote-docs`,
  `--help`, `--version`. Resolution order: flag > env (`OPC_WIKI_*`) >
  prompt (TTY only) > default.
- **OpenClaw and Hermes-agent presets** for IM-based AI agents — paste-in
  install recipes documented in `docs/INSTALL-FOR-AGENTS.md`.
- **`--json` output** for programmatic / orchestration use, with stable
  schema documented in [STABILITY.md](./STABILITY.md).
- **`agents.json`** machine-readable manifest at the package root,
  declaring the canonical install command and supported agents.
- **`llms.txt`** GEO surface at the package root (per
  [llmstxt.org](https://llmstxt.org/)).
- **Static site target** (`templates/site/`): zero-framework Node-only
  builder that emits `dist/index.html`, per-page `<domain>/<slug>/index.html`
  with OpenGraph + Twitter card + JSON-LD `Article` + canonical URL,
  plus `sitemap.xml`, `robots.txt`, `llms.txt`, and `feed.xml` (RSS).
  Privacy gate enforced (only `privacy: public` pages publish).
- **GitHub Pages workflow** (`.github/workflows/wiki-publish.yml`)
  scaffolded into the user's vault when the site extra is enabled.
- **`INSPIRATION.md`** with verbatim quotes from
  [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f),
  full attribution, and a mapping from gist concepts to this project's
  implementation.
- **Karpathy gist URL embedded** in README.md, llms.txt, agents.json,
  docs/INSTALL-FOR-AGENTS.md, and every generated agent-rules / index /
  USAGE / wiki/_index file.
- **README.md restructured** for SEO — keyword-rich headings, structured
  FAQ, agent-install table, comparison vs RAG/NotebookLM.
- **`STABILITY.md`** declaring the semver-covered surface (CLI flags, file
  paths, frontmatter schema, MCP tool signatures) and what is not covered
  (template prose, visual design, defaults).
- **Comprehensive smoke test** (`scripts/smoke-scaffold.mjs`): exercises
  4 CLI flag combos, MCP server syntax check, site builder syntax check,
  Karpathy attribution regression across 9 files.
- **End-to-end test** (`scripts/e2e.mjs`): real `npm install` + boot MCP +
  send `tools/list` + assert 3 tools + drop fixture + build site + assert
  SEO/GEO outputs (sitemap, llms.txt, robots.txt, OG, JSON-LD).
- **CI matrix** (`.github/workflows/ci.yml`): 3 OSes × 2 Node versions for
  smoke; ubuntu for e2e.
- **Release workflow** (`.github/workflows/release.yml`): publishes to npm
  with provenance on `v*.*.*` tag.

### Changed

- `package.json` description, keywords, and `files` whitelist updated.
- Default agent set unchanged (`claude,codex,cursor`); new `openclaw`,
  `hermes`, `opencode` keys are opt-in.
- The previously-skipped `astro` extra renamed to `site` (the implementation
  is no longer Astro-specific — zero-framework Node).

### Notes for v0.1.0-alpha.0 users

Anyone scaffolding from `0.1.0-alpha.0`: the CLI is now fully flag-driven,
prompts only fire when run from a TTY without `--yes`, and the site target
ships real output. No migration needed for existing scaffolded vaults.

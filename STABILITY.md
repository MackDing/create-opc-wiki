# Stability & Semver Scope

`create-opc-wiki` follows [Semantic Versioning](https://semver.org/) starting
at v1.0.0. This document declares **what is covered by semver** and **what is
not** — i.e. what changes will require a major bump.

## Covered (breaking changes require a major bump)

### CLI flags

These flag names, types, and semantics are stable. New flags may be added in
minor versions; existing ones will not change shape without a major bump.

| Flag | Type |
|---|---|
| positional `<name>` | string |
| `--name <s>` | string |
| `--domains <csv>` | comma-separated string |
| `--agents <csv>` | comma-separated string |
| `--mcp` / `--no-mcp` | boolean |
| `--site` / `--no-site` | boolean |
| `--recipes` / `--no-recipes` | boolean |
| `--git` / `--no-git` | boolean |
| `--remote-docs` | boolean |
| `-y`, `--yes` | boolean |
| `--json` | boolean |
| `--quiet` | boolean |
| `--help`, `-h` | boolean |
| `--version`, `-V` | boolean |

`--json` output schema:

```json
{
  "ok": true,
  "target": "/abs/path",
  "files": 28,
  "dirs": 17,
  "skipped": [],
  "agents": ["claude","codex","cursor"],
  "domains": ["tech","finance","reading","growth","insights"],
  "extras": ["mcp","recipes","site"]
}
```

Adding new fields to this object is non-breaking. Removing or renaming is
breaking.

### Generated file paths

These paths in the scaffolded vault are stable:

- `agent-rules/main.md` — canonical rules file
- `agent-rules/.targets` — newline-delimited list of agent keys
- `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/main.mdc`, `.cursorrules`,
  `.github/copilot-instructions.md`, `.trae/rules.md`,
  `.openclaw/rules.md`, `.hermes/agent.md` — agent rule sync targets
- `wiki/<domain>/_index.md` — domain index
- `raw/{articles,papers,chats,notes}/` — raw source layout
- `mcp/server.mjs` — MCP server entry
- `site/build.mjs`, `site/site.config.json` — static site entry + config
- `.github/workflows/wiki-publish.yml` — GitHub Pages workflow

Renaming or moving any of these is a breaking change.

### Frontmatter schema

The required and recognized frontmatter fields on wiki pages:

| Field | Type | Stability |
|---|---|---|
| `title` | string | stable |
| `domain` | string | stable |
| `confidence` | `high \| medium \| speculative` | stable |
| `privacy` | `public \| private \| secret` | stable; defaults to `private` if omitted |
| `created` | ISO date | stable |
| `last-updated` | ISO date | stable |
| `tags` | string[] | stable |
| `sources` | string[] of wikilinks | stable |
| `description` | string | optional, used by site builder |

New optional fields may be added. Required fields will not be removed without
a major bump.

### MCP tool surface

The MCP server exposes three tools, with stable names, parameter schemas, and
return shapes:

- `wiki_query(query: string, limit?: number = 5)` → array of matches
- `wiki_list(domain?: string)` → array of page summaries
- `wiki_read(path: string)` → full markdown text

Privacy enforcement: pages with `privacy: secret` are never returned by any
tool. This guarantee is part of the stable surface.

## Not covered

- **Template prose** — the wording inside `agent-rules/main.md.tpl`,
  `USAGE.md.tpl`, `index.md.tpl`, etc. may change in minor releases.
- **Skill prose** — `skills/wiki-{ingest,query,lint}.md` may be reworded.
- **Recipe prose** — `recipes/*.md` may be updated.
- **Astro/site visual design** — the generated HTML structure and CSS in
  `site/build.mjs` is implementation detail and may change.
- **Internal API** (`dist/api.js`) — exported for testing only; not
  guaranteed across minor versions.
- **Default values** — defaults for `--domains`, `--agents`, etc. may change
  in minor versions if the new defaults are clearly better. The flag itself
  remains stable.

## Deprecation policy

When a stable surface needs to change:

1. The new behavior ships in a minor version under a new flag/field, with the
   old one still working.
2. The old surface emits a deprecation notice on stderr.
3. The old surface is removed in the next major version, no earlier than
   90 days after the deprecation notice ships.

## Testing the stable surface

`scripts/smoke-scaffold.mjs` exercises every covered flag combo and asserts
every covered file path. `scripts/e2e.mjs` boots the MCP server and the site
build for a real check. CI runs both on every PR; failures gate merge.

# Announcement draft

> This is a **draft** for the user to post themselves — this package does not
> announce to any platform.

---

## Show HN / X / LinkedIn short form (<280 chars)

> Built `create-opc-wiki` — a one-line scaffolder for a personal LLM wiki on
> the Karpathy pattern. Multi-agent (works with OpenClaw/Hermes/Claude/Codex/
> Cursor), MCP built-in, SEO/GEO publish target.
>
> `npx -y create-opc-wiki@latest ~/wiki --yes`
>
> https://github.com/MackDing/create-opc-wiki

## Show HN long form

**Show HN: create-opc-wiki — scaffold a personal LLM wiki in one line**

Inspired by Andrej Karpathy's "LLM Wiki" gist
(<https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>), which
argues that an LLM should *compile* knowledge into a persistent wiki instead
of re-deriving it from raw docs on every query.

This is one opinionated instantiation of that idea:

- Three-layer vault: `raw/` (immutable), `wiki/<domain>/` (agent-maintained),
  `agent-rules/main.md` (canonical schema, synced to 9 agent file formats:
  CLAUDE.md, AGENTS.md, .cursor/rules/main.mdc, .cursorrules,
  .github/copilot-instructions.md, .trae/rules.md, .openclaw/rules.md,
  .hermes/agent.md — edit once, propagate everywhere)
- MCP server with 3 tools (`wiki_query`, `wiki_list`, `wiki_read`). Pages
  with `privacy: secret` are never returned — enforced at the MCP boundary
- Privacy-tagged frontmatter (`public/private/secret`) and a static-site
  publish target that emits `sitemap.xml`, `llms.txt`, `robots.txt`, RSS,
  OpenGraph + JSON-LD per page — only `privacy: public` pages publish
- Confidence levels (`high/medium/speculative`) with decay reminders —
  stale `speculative` claims get flagged for re-evaluation
- Zero-prompt install for any IM-based agent (paste one shell command in
  OpenClaw or Hermes and the user gets a full vault)

One line:

```
npx -y create-opc-wiki@latest ~/wiki --yes --agents=claude,codex,cursor,openclaw,hermes
```

MIT. The idea is Andrej's — all implementation choices (ontology, agent
sync, privacy boundary, SEO/GEO target) are mine. Full attribution and
verbatim quotes in INSPIRATION.md.

## Twitter/X thread draft (5 posts)

1/ Built a scaffolder for the Karpathy "LLM Wiki" pattern. One line, one
wiki, readable by every agent on your machine. Compile knowledge, don't
hoard raw.

2/ Three layers: `raw/` (immutable sources), `wiki/<domain>/` (agent-
maintained markdown), `agent-rules/main.md` (one rules file, synced to
CLAUDE.md, AGENTS.md, Cursor, Copilot, Trae, OpenClaw, Hermes).

3/ MCP server built in. Three tools. `privacy: secret` pages NEVER leave
the box — enforced at the MCP boundary, enforced at the publish boundary.

4/ Static-site target emits `sitemap.xml` + `llms.txt` (GEO) + `robots.txt`
+ RSS + OpenGraph + JSON-LD. Only `privacy: public` pages publish. Drop on
GitHub Pages in one workflow.

5/ `npx -y create-opc-wiki@latest ~/wiki --yes` — inspired by
<https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>. MIT.
<https://github.com/MackDing/create-opc-wiki>

---

## Reddit r/LocalLLaMA long form (adapt as needed)

Same body as Show HN above, with these added sections:

- **How it's different from Obsidian + LLM plugin**: the agent owns the
  wiki layer, the user owns raw sources; no plugin required; works with
  any agent CLI.
- **Why not just RAG**: RAG re-derives every answer. Compiled wikis
  accumulate — cross-references already exist, contradictions already
  flagged, the synthesis already reflects every source.
- **Works with these agents today**: Claude Code, Codex CLI, OpenCode/Pi,
  Cursor, VSCode+Copilot, Trae, OpenClaw, Hermes. One canonical rules file.
- **License**: MIT. Fork it, port it, or implement from the gist directly —
  all valid.

---

## Post-publish checklist (for the user)

- [ ] Verify `npx create-opc-wiki@latest test-wiki --yes` works from npm
- [ ] Tag GitHub release with CHANGELOG.md contents
- [ ] Post Show HN (Tuesday morning PT ~9 AM is empirically the best slot)
- [ ] Post on X with the gist URL clearly credited
- [ ] Submit to r/LocalLLaMA, r/ObsidianMD, r/productivity
- [ ] Add to awesome-claude-code / awesome-mcp-servers lists
- [ ] Tweet at Karpathy with proper attribution — this is derivative of his
      gist and he'll probably want to see it

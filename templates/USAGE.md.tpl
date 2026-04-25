---
title: Usage Guide
created: {{today}}
last-updated: {{today}}
---

# {{projectName}} — Usage Guide

Two ways to use this wiki, side by side.

## Entry 1: Obsidian — daily reading & writing

Open this folder as an Obsidian Vault. Recommended shortcuts:

| Action | Shortcut |
|--------|----------|
| Open page | `Ctrl+O` (or `Cmd+O` on Mac) → type name → Enter |
| New page | Type a non-existent name in the open dialog → Enter |
| Search | `Ctrl+Shift+F` |
| Command palette | `Ctrl+P` (`Cmd+P` on Mac) |
| Graph view | sidebar → graph |

### Markdown conventions

- `[[wiki/{{firstDomain}}/some-article]]` — internal wikilink
- `#tag` — tag
- `- [ ] task` — task box

## Entry 2: AI Agent — synthesis & maintenance

This vault is configured for the agent(s) you selected during scaffold:

{{#agents}}
- **{{label}}** → reads `{{rulesPath}}`
{{/agents}}

### Three core commands

**`/wiki-ingest <URL or file path>`**

Ingest new material. The agent will:
1. Read source
2. Save to `raw/` (immutable)
3. Distill 10-15 core concepts
4. Enrich existing pages or create new ones
5. Maintain `[[wikilink]]` graph
6. Update indexes + log

Examples:
```
/wiki-ingest https://paulgraham.com/ds.html
/wiki-ingest ~/Downloads/paper.pdf
/wiki-ingest @recipes/arxiv-paper.md https://arxiv.org/abs/2501.xxxxx
```

**`/wiki-query <question>`**

Query the knowledge base. The agent searches relevant pages, synthesizes
an answer, then asks if you want to save the answer as a new page.

Examples:
```
/wiki-query What's the relationship between Kelly criterion and position sizing?
/wiki-query transformer 和 RAG 有什么区别
```

**`/wiki-lint`**

Periodic health check:
- Contradictions
- Duplicates >80% overlap → merge suggestions
- Orphan pages (no incoming wikilinks)
- `last-updated` >60 days
- Missing frontmatter fields
- `confidence: speculative` >30 days → re-evaluation prompt

## Typical workflows

### Save an article you read on the web
1. Copy the URL
2. `cd <vault>` and start your AI agent
3. `/wiki-ingest <URL>`
4. Refresh Obsidian; the new page appears under the relevant domain

### Quick note then file later
1. In Obsidian: type a new page name, write markdown
2. Later: `/wiki-ingest <path-to-the-note>` to let the agent file and connect it

### Find knowledge
- **Simple keyword**: Obsidian `Ctrl+Shift+F`
- **Complex / cross-domain**: `/wiki-query <question>`

### Monthly maintenance
- `/wiki-lint` → triage report → merge / cross-link / archive

## Optional features (if you enabled them)

### MCP server

Run `npm run wiki:mcp` to start. Connect from Claude Desktop / Cursor /
Codex. See `mcp/README.md` for client config snippets.

### Static site publishing

Run `npm run wiki:publish` to build an Astro Starlight static site under
`dist/`. Only articles with `privacy: public` in frontmatter are included.
Deploy `dist/` to GitHub Pages, Cloudflare Pages, Netlify, anywhere.

### Multi-agent rule sync

Edit `agent-rules/main.md` (the source of truth). Run
`./scripts/sync-agent-rules.sh` to propagate to your enabled agents
(`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/main.mdc`,
`.github/copilot-instructions.md`, `.trae/rules.md`).

## Related files

- [[agent-rules/main]] — Agent behavior rules (source of truth)
- [[index]] — Wiki home
- [[log]] — Change log

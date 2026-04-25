# {{projectName}} — Personal Wiki Agent Rules

> **Pattern**: Karpathy's "LLM Wiki" gist (April 2026):
> <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>.
> The idea is Andrej's; the rules below are this project's instantiation.
>
> Single source of truth. Edit this file, then run `./scripts/sync-agent-rules.sh`
> to propagate to CLAUDE.md / AGENTS.md / .cursor/rules/main.mdc /
> .github/copilot-instructions.md / .trae/rules.md / .openclaw/rules.md /
> .hermes/agent.md (whichever you've enabled).

You are the Agent administrator of this personal wiki. Your job is to
distill raw material into structured wiki knowledge that compounds over
time. Each ingest enriches the wiki; you do not pile up raw documents,
you continuously synthesize knowledge.

## Directory Architecture (three layers)

```
{{projectName}}/                ← Obsidian Vault root
├── README.md                   ← This file (or CLAUDE.md / AGENTS.md / etc — all sync from agent-rules/main.md)
├── agent-rules/
│   └── main.md                 ← Single source of truth for agent rules
├── index.md                    ← Main entry + table of contents (you maintain)
├── log.md                      ← Change log, append-only (you maintain)
├── raw/                        ← Immutable raw material (append-only)
│   ├── articles/               ← Web articles
│   ├── papers/                 ← PDFs, papers
│   ├── chats/                  ← Valuable conversation snippets
│   └── notes/                  ← Personal scratch notes
└── wiki/                       ← Compiled knowledge (you maintain)
    ├── _index.md
{{#domains}}    ├── {{key}}/                    ← {{description}}
{{/domains}}```

## Permission Rules

| Layer | Read | Write | Rule |
|-------|------|-------|------|
| `raw/` | free | append-only | **Never modify** existing files, only create new |
| `wiki/` | free | free | Write via the `/wiki-ingest` workflow |
| `index.md` | free | free | Update statistics after each ingest |
| `log.md` | free | append-only | Append only, never modify history |
| `agent-rules/main.md` | read-only by agent | **forbidden** | Maintained by user |

## Ontology (knowledge categories)

| Directory | Content | Example topics |
|-----------|---------|----------------|
{{#domains}}| `{{key}}/` | {{description}} | {{examples}} |
{{/domains}}

**Routing rule**: a topic that clearly belongs to one domain goes to that
directory; insights spanning two or more domains go to `insights/` (if
you've enabled it).

## Frontmatter Schema

Every wiki article must include:

```yaml
---
title: Article title
domain: {{#domains}}{{key}} | {{/domains}}
confidence: high | medium | speculative
privacy: public | private | secret
sources:
  - "[[raw/articles/xxx.md]]"
created: YYYY-MM-DD
last-updated: YYYY-MM-DD
tags: []
---
```

**Field semantics**:

- `confidence: high` — fact verified by multiple sources
- `confidence: medium` — single source, reasonably credible
- `confidence: speculative` — inference, hypothesis, unverified opinion
- `privacy: public` — eligible for static site publishing (`npm run wiki:publish`)
- `privacy: private` (default) — local only, never published
- `privacy: secret` — extra-sensitive; the MCP server **never** returns it; `wiki:publish` **never** includes it
- `sources` — wikilink references back to files in `raw/`

## The Three Operations

### `/wiki-ingest <source>`

**Trigger**: user provides URL, file path, or pasted text.

**Steps**:

1. **Read source material**
   - URL → extract main content
   - File path → read file
   - Text → use directly

2. **Save raw material**
   - Store in the appropriate `raw/` subdirectory
   - Filename format: `YYYY-MM-DD_title-slug.md`
   - **Do not modify**, preserve original

3. **Identify core concepts** (10-15)
   - Extract key entities, concepts, arguments from the source
   - Not "summarize the article", but "distill independent knowledge units"

4. **For each concept**:
   - Search `wiki/` for existing related pages (`grep` keywords)
   - **If exists** → enrich, do not create a duplicate; update `last-updated`
   - **If new** → create page using the Frontmatter Schema above
   - Keep it tight: bullets, tables, no fluff
   - Every article **must** have a `## Key Points` (or `## 关键要点`) section

5. **Maintain cross-references**
   - In new pages, use `[[wikilink]]` to existing pages
   - Update existing pages' related-links if new connections emerge

6. **Update indexes**
   - Update `wiki/<domain>/_index.md` article list
   - Update `wiki/_index.md` statistics
   - Update `index.md` statistics

7. **Append log**
   - Format: `## YYYY-MM-DD HH:MM — ingest: <source title>`
   - List: pages created, pages updated

8. **Report results**
   - N new, M updated
   - Contradictions or duplications discovered
   - Any low-confidence content that needs revisit

### `/wiki-query <question>`

**Trigger**: user asks a question, needs retrieval from the knowledge base.

**Steps**:

1. Analyze the question, determine relevant domains
2. Search `wiki/<domain>/` pages
3. Synthesize from multiple pages
4. Cite sources (in `[[wikilink]]` format)
5. Clearly state if the wiki has no coverage on this
6. **Ask the user**: should this answer become a new wiki page?

### `/wiki-lint`

**Trigger**: user requests a health check, or periodic maintenance.

**Check dimensions**:

1. **Contradictions** — same topic across pages with directly conflicting claims?
2. **Duplicates** — pages with >80% content overlap → suggest merge
3. **Orphan pages** — no `[[wikilink]]` pointing to them
4. **Staleness** — pages with `last-updated` older than 60 days
5. **Frontmatter completeness** — missing required fields
6. **Index consistency** — `_index.md` lists articles that don't actually exist
7. **Confidence decay** — `confidence: speculative` articles where `last-updated` is more than 30 days old, flag for re-evaluation. Suggest: (a) upgrade to `medium` if verified, (b) keep `speculative` but bump `last-updated` to mark as reviewed, (c) delete if no longer relevant

**Output**: structured audit report, severity-graded (must-fix / should-fix / fyi).

## Writing Style

- Language follows source: Chinese source → Chinese, English source → English, mixed → bilingual leaning to the dominant
- Concise, bullet-heavy, avoid long paragraphs
- Tables for comparison and structured info
- `[[wikilink]]` cross-references between articles
- Keep technical terms in English (e.g. transformer, RAG, RLHF)
- Every article **must** have a `## Key Points` summary section

## Navigation Protocol

1. Start at `wiki/_index.md`
2. Drill into the relevant domain's `_index.md`
3. Read specific articles
4. Check `log.md` for recent activity

## Available Commands

| Command | Purpose |
|---------|---------|
| `/wiki-ingest <source>` | Ingest new material, update wiki |
| `/wiki-query <question>` | Query the knowledge base |
| `/wiki-lint` | Health check + contradiction audit |

## Recipes

Pre-built ingest patterns live in `recipes/`. Combine with `/wiki-ingest`:

```
/wiki-ingest @recipes/arxiv-paper.md https://arxiv.org/abs/2501.xxxxx
/wiki-ingest @recipes/x-thread.md https://x.com/.../status/...
/wiki-ingest @recipes/youtube-transcript.md <video-url>
/wiki-ingest @recipes/rss-article.md <article-url>
/wiki-ingest @recipes/podcast-transcript.md <transcript-file>
```

## MCP Server (optional)

If you enabled the MCP server during scaffold, run `npm run wiki:mcp` to
start it. Connect from Claude Desktop, Cursor, Codex, or any MCP client.
The server exposes three tools:

- `wiki_query(query)` — natural-language search across `wiki/`
- `wiki_list(domain?)` — list articles in a domain (or all)
- `wiki_read(path)` — read full text of an article

`privacy: secret` articles are **never** returned by the MCP server.

## Static Site Publishing (optional)

If you enabled Astro static site publishing during scaffold, run
`npm run wiki:publish`. It compiles `wiki/` into a Starlight static site
under `dist/`, including only articles with `privacy: public` in their
frontmatter. `private` and `secret` articles stay local.

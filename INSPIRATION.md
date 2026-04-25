# Inspiration & Attribution

> This project operationalizes the **"LLM Wiki"** pattern proposed by
> Andrej Karpathy in this gist (April 2026):
>
> <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
>
> Karpathy's gist explicitly invites derivatives: *"This is an idea file, it
> is designed to be copy pasted to your own LLM Agent ... Its goal is to
> communicate the high level idea, but your agent will build out the specifics
> in collaboration with you."*
>
> The idea is Andrej's. The implementation choices in this package — the
> directory ontology, the multi-agent rule sync, the MCP tool surface, the
> privacy frontmatter, the static site target with SEO/GEO outputs, the
> non-interactive install path for IM agents — are this project's.

---

## The core idea (verbatim from the gist)

> Most people's experience with LLMs and documents looks like RAG: you upload
> a collection of files, the LLM retrieves relevant chunks at query time, and
> generates an answer. This works, but the LLM is rediscovering knowledge
> from scratch on every question. There's no accumulation.
>
> The idea here is different. Instead of just retrieving from raw documents
> at query time, the LLM **incrementally builds and maintains a persistent
> wiki** — a structured, interlinked collection of markdown files that sits
> between you and the raw sources. When you add a new source, the LLM doesn't
> just index it for later retrieval. It reads it, extracts the key
> information, and integrates it into the existing wiki — updating entity
> pages, revising topic summaries, noting where new data contradicts old
> claims, strengthening or challenging the evolving synthesis. The knowledge
> is compiled once and then *kept current*, not re-derived on every query.
>
> This is the key difference: **the wiki is a persistent, compounding
> artifact.** The cross-references are already there. The contradictions
> have already been flagged. The synthesis already reflects everything
> you've read. The wiki keeps getting richer with every source you add and
> every question you ask.

## Architecture: three layers (verbatim from the gist)

> **Raw sources** — your curated collection of source documents. Articles,
> papers, images, data files. These are immutable — the LLM reads from them
> but never modifies them. This is your source of truth.
>
> **The wiki** — a directory of LLM-generated markdown files. Summaries,
> entity pages, concept pages, comparisons, an overview, a synthesis. The
> LLM owns this layer entirely. It creates pages, updates them when new
> sources arrive, maintains cross-references, and keeps everything
> consistent. You read it; the LLM writes it.
>
> **The schema** — a document (e.g. CLAUDE.md for Claude Code or AGENTS.md
> for Codex) that tells the LLM how the wiki is structured, what the
> conventions are, and what workflows to follow when ingesting sources,
> answering questions, or maintaining the wiki. This is the key
> configuration file — it's what makes the LLM a disciplined wiki maintainer
> rather than a generic chatbot.

## How this project maps to the gist

| Gist concept | This project |
|---|---|
| **Raw sources** | `raw/{articles,papers,chats,notes}/` — immutable, append-only |
| **Wiki** | `wiki/<domain>/*.md` — agent-maintained markdown |
| **Schema** | `agent-rules/main.md` (canonical), synced to 9 agent file formats |
| **Ingest** | `/wiki-ingest` skill |
| **Query** | `/wiki-query` skill |
| **Lint** | `/wiki-lint` skill (adds confidence decay over the gist baseline) |
| **index.md** | `index.md` — content catalog, agent-maintained |
| **log.md** | `log.md` — chronological, append-only |
| **Optional CLI tools** | MCP server (`wiki_query`, `wiki_list`, `wiki_read`) |

## What this project adds beyond the gist

The gist is intentionally abstract. Concrete choices added here:

- **Privacy frontmatter** (`public | private | secret`) with enforcement at
  the MCP server boundary and the static-site publish boundary.
- **Confidence decay**: `speculative` claims older than 30 days get flagged
  for re-evaluation by the lint skill.
- **Multi-agent rule sync**: one canonical rules file fans out to nine
  formats (CLAUDE.md, AGENTS.md, .cursor/rules/main.mdc, .cursorrules,
  .github/copilot-instructions.md, .trae/rules.md, .openclaw/rules.md,
  .hermes/agent.md).
- **Non-interactive install**: any IM-based agent (OpenClaw, Hermes) can
  install the wiki for a user with a single shell command.
- **SEO + GEO publish target**: optional Astro Starlight site emits
  `sitemap.xml`, `llms.txt`, `robots.txt`, RSS feed, OpenGraph + JSON-LD
  per page.
- **`npx` zero-config bootstrap**: `npx create-opc-wiki my-wiki --yes`.

## Note from the gist

Karpathy closes with:

> This document is intentionally abstract. It describes the idea, not a
> specific implementation. The exact directory structure, the schema
> conventions, the page formats, the tooling — all of that will depend on
> your domain, your preferences, and your LLM of choice. Everything
> mentioned above is optional and modular — pick what's useful, ignore what
> isn't.

This package is one opinionated instantiation. Use it as-is, fork it, or
re-implement from the gist directly — all valid.

## Related lineage

The gist itself acknowledges Vannevar Bush's **Memex** (1945) — *"a
personal, curated knowledge store with associative trails between
documents."* The piece Bush couldn't solve was who maintains the trails.
The LLM does.

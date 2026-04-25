# create-opc-wiki

> **Build your own personal LLM wiki in 30 seconds.** Multi-agent native, MCP-ready, SEO/GEO-optimized publish target.

> **Inspired by [Andrej Karpathy's "LLM Wiki" gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).**
> This package is one concrete instantiation of that idea — opinionated about agent rules, directory ontology, frontmatter schema, privacy, and the publish pipeline. The idea is Andrej's; the implementation is this project's. Full credit and quoted lineage in [INSPIRATION.md](./INSPIRATION.md).

```bash
# Interactive
npx create-opc-wiki my-wiki

# Zero-prompt (any agent, any IM, any CI)
npx -y create-opc-wiki@latest ~/wiki --yes --agents=claude,codex,cursor,openclaw,hermes
```

That's it. Open the generated folder in Obsidian, fire up your AI agent, and start building your second brain.

## Quickstart

```bash
npx create-opc-wiki my-wiki         # interactive prompts
cd my-wiki
# Open in Obsidian: File → Open Vault → this folder
# Or fire up Claude Code / Codex / Cursor and try /wiki-ingest <url>
```

## What it scaffolds

A local-first knowledge base with three layers (per the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)):

- **`raw/`** — immutable source archive (articles, papers, chats, notes)
- **`wiki/<domain>/`** — agent-compiled markdown, your synthesized knowledge
- **`agent-rules/main.md`** — single source of truth for agent behavior, synced to nine agent file formats

Plus:

- ✨ **Multi-agent native** — one rules file, synced to `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/main.mdc`, `.cursorrules`, `.github/copilot-instructions.md`, `.trae/rules.md`, `.openclaw/rules.md`, `.hermes/agent.md`
- 🔌 **MCP server built-in** — three tools (`wiki_query`, `wiki_list`, `wiki_read`) with privacy enforcement at the boundary
- 📥 **5 source recipes** — arXiv papers, X threads, YouTube transcripts, RSS articles, podcast transcripts
- 🌐 **SEO + GEO publish target** — `npm run wiki:publish` produces an Astro Starlight site with `sitemap.xml`, `llms.txt`, `robots.txt`, RSS feed, OpenGraph + JSON-LD
- 🔒 **Privacy-first frontmatter** — `public / private / secret` levels; secret never leaves the box, private never publishes
- 🩺 **Epistemic hygiene** — `confidence: high|medium|speculative` with decay reminders for stale `speculative` claims
- 📚 **Three reusable skills** — `/wiki-ingest`, `/wiki-query`, `/wiki-lint`

## Install in any AI agent (paste-in recipes)

The scaffolder is fully non-interactive when given `--yes`. Any agent that can run a shell command can install the wiki for you in one line. Per-agent recipes in **[`docs/INSTALL-FOR-AGENTS.md`](./docs/INSTALL-FOR-AGENTS.md)**.

| Agent | One-liner (paste to the agent) |
|---|---|
| **OpenClaw (IM)** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=openclaw,claude` |
| **Hermes-agent (IM)** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=hermes,codex` |
| **Claude Code** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=claude` |
| **Codex CLI / OpenCode / Pi** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=codex` |
| **Cursor** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=cursor` |
| **VSCode + Copilot** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=vscode` |
| **Trae IDE** | `npx -y create-opc-wiki@latest ~/wiki --yes --agents=trae` |

Or grab them all: `--agents=claude,codex,cursor,vscode,trae,openclaw,hermes`.

## How it differs from RAG / NotebookLM / file uploads

Most LLM-on-files setups (NotebookLM, ChatGPT file uploads, raw RAG) re-derive answers from raw documents at every query. There is no accumulation. Quoting the [original gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):

> Instead of just retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files that sits between you and the raw sources. The wiki keeps getting richer with every source you add and every question you ask.

This package operationalizes exactly that, with concrete choices for ontology, agent rules, MCP, and publishing.

## CLI flags

| Flag | Purpose |
|---|---|
| `--name <s>` | project dir name (or first positional) |
| `--domains <csv>` | knowledge domains (default: `tech,finance,reading,growth,insights`) |
| `--agents <csv>` | agent rule targets (default: `claude,codex,cursor`) |
| `--mcp` / `--no-mcp` | include MCP server (default yes) |
| `--site` / `--no-site` | include Astro static site target (default yes) |
| `--recipes` / `--no-recipes` | include source ingest recipes (default yes) |
| `--git` / `--no-git` | git init + first commit (default yes) |
| `-y`, `--yes` | accept all defaults, no prompts |
| `--json` | emit machine-readable result on stdout |

Full help: `npx create-opc-wiki --help`. Semver scope is documented in [STABILITY.md](./STABILITY.md).

## FAQ

**Q: Why a wiki instead of just RAG?**
A wiki compiles and reuses synthesis. RAG re-derives it on every query. See [INSPIRATION.md](./INSPIRATION.md) for Karpathy's framing.

**Q: Does my data leave the machine?**
No. The wiki is a local Obsidian vault. The MCP server runs locally over stdio. The static site only publishes pages with `privacy: public` in frontmatter.

**Q: Which agent should I use?**
Any of the nine supported. Use `--agents=claude,codex,cursor,openclaw,hermes` to target several at once and edit `agent-rules/main.md` once for all of them.

**Q: How is "GEO" different from "SEO"?**
SEO targets web search (Google, Bing). **GEO** = Generative Engine Optimization — making your content discoverable to LLM crawlers (ChatGPT, Claude, Perplexity). The published site emits both: `sitemap.xml` for SEO, `llms.txt` + structured prose for GEO.

**Q: Will this stay stable across upgrades?**
Yes — see [STABILITY.md](./STABILITY.md). CLI flags, generated file paths, frontmatter schema, and MCP tool signatures are covered by semver. Template prose is not.

**Q: Can I use this without npm/Node?**
Today, no. The scaffolder runs once via `npx`; after that the generated wiki is plain markdown and works without Node. The optional MCP server and Astro site need Node 20+.

## On the road to OPC

OPC = One Person Company. Thesis: with AI, a single person can run what used to take a team. A maintained second brain is infrastructure for that. This tool is one of the building blocks.

## License

[MIT](./LICENSE). Inspired by [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f); see [INSPIRATION.md](./INSPIRATION.md) for full attribution.

Contributing: see [CONTRIBUTING.md](./CONTRIBUTING.md). Security: see [SECURITY.md](./SECURITY.md). Stability scope: [STABILITY.md](./STABILITY.md).

---

## 🦞 OPC Ecosystem

> Built by [@MackDing](https://github.com/MackDing) — One-Person Company infrastructure powered by AI agents.

| Project | What it does |
|---------|-------------|
| [**opc.ren**](https://opc.ren) | OPC founder hub — tools, signals, community |
| [**CodexClaw**](https://github.com/MackDing/CodexClaw) | Telegram bot for remote Codex access with MCP + subagent routing |
| [**awesome-ai-api**](https://github.com/MackDing/awesome-ai-api) | Leaderboard of 200+ AI API gateways & relays |
| [**claude-context-health**](https://github.com/MackDing/claude-context-health) | Diagnose & fix Claude Code session degradation |
| [**opc-daily-signal**](https://github.com/MackDing/opc-daily-signal) | AI-powered daily decision intelligence for OPC founders |
| [**doc-preprocess-hub**](https://github.com/MackDing/doc-preprocess-hub) | Enterprise document preprocessing — MinerU + docling |

# create-opc-wiki

> Build your own local LLM Wiki in 30 seconds.
>
> Multi-agent native (Claude Code / Codex / Cursor / VSCode / Trae). MCP server built-in. Astro static site publishing. Privacy-first.

```bash
npm create opc-wiki my-wiki
# or
bunx create-opc-wiki my-wiki
```

That's it. Open the generated folder in Obsidian, fire up your favorite AI agent, and start building your second brain.

---

> 🚧 **Status: alpha (v0.1.0-alpha.0)** — actively being built. README will be filled out before the first stable release.

## What you get

A local-first knowledge base, on the [Karpathy LLM Wiki Pattern](https://x.com/karpathy/status/...), with:

- ✨ **Multi-agent native** — one source of truth, synced to `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/main.mdc`, `.github/copilot-instructions.md`, `.trae/rules.md`
- 🔌 **MCP server built-in** — your wiki is queryable by any MCP client (Claude Desktop, Cursor, Codex)
- 📥 **5 ingest recipes** — arXiv papers, X threads, YouTube transcripts, RSS articles, podcast transcripts
- 🌐 **Static site publishing** — `npm run wiki:publish` → beautiful Astro Starlight site
- 🔒 **Privacy-first frontmatter** — `public / private / secret` levels, default `private`
- 🩺 **Epistemic hygiene** — `confidence` levels with decay reminders for stale `speculative` claims
- 📚 **Karpathy LLM Wiki Pattern, operationalized** — three reusable skills: `/wiki-ingest`, `/wiki-query`, `/wiki-lint`

## Why

Note-taking apps treat your knowledge as raw piles. The LLM Wiki Pattern says: **compile knowledge, don't hoard raw**. Raw is immutable archive. Wiki is the compiled, refined view.

This tool ships that pattern as a one-line scaffold.

## On the road to OPC

OPC = One Person Company. The thesis: with AI, a single person can run what used to take a team. Your second brain is infrastructure for that. This tool is one of the building blocks.

## License

[MIT](./LICENSE)


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

# Recipes — pre-built ingest patterns

Recipes are reusable templates that tell the agent *how* to extract
knowledge from a particular kind of source. Each recipe defines:

- When to use it (which kinds of sources fit)
- Default frontmatter for the page being created
- Extraction priorities (what matters most for that source type)
- Page structure (the sections to aim for)
- Anti-patterns to avoid

## Usage

Pass a recipe alongside `/wiki-ingest`:

```
/wiki-ingest @recipes/arxiv-paper.md https://arxiv.org/abs/2501.12345
/wiki-ingest @recipes/x-thread.md https://x.com/karpathy/status/123
/wiki-ingest @recipes/youtube-transcript.md https://youtube.com/watch?v=...
/wiki-ingest @recipes/rss-article.md https://paulgraham.com/some-essay.html
/wiki-ingest @recipes/podcast-transcript.md ./otter-export.txt
```

Without a recipe, `/wiki-ingest` falls back to the generic workflow in
`agent-rules/main.md` (or your synced `CLAUDE.md` / `AGENTS.md`).

## Bundled recipes

| Recipe | Source | Best for |
|--------|--------|----------|
| `arxiv-paper.md` | arXiv abs / PDF | Pre-prints, research papers |
| `x-thread.md` | X (Twitter) thread | First-person practitioner posts |
| `youtube-transcript.md` | YouTube transcript | Long-form interviews, talks |
| `rss-article.md` | Blog post / news article | Editorialized long-form |
| `podcast-transcript.md` | Podcast transcript | Conversational opinion calibration |

## Adding your own recipes

Recipes are just markdown. Add a file in `recipes/` following the same
structure (When / Frontmatter / Priorities / Page structure / Anti-patterns).
PRs welcome to upstream.

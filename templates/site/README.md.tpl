# {{projectName}} — Static Site Target

A zero-framework static site that publishes only `privacy: public` pages from
your wiki. Designed for SEO + GEO out of the box.

## Outputs

| File | Purpose |
|---|---|
| `dist/index.html` | Home page with JSON-LD `WebSite`, RSS link |
| `dist/<domain>/<slug>/index.html` | Each public page with OpenGraph, Twitter card, JSON-LD `Article`, canonical URL |
| `dist/sitemap.xml` | All public URLs (SEO) |
| `dist/robots.txt` | Allow-all (you can edit) |
| `dist/llms.txt` | LLM-friendly index per [llmstxt.org](https://llmstxt.org/) (GEO) |
| `dist/feed.xml` | RSS 2.0 of recent public pages |

## Configure

Edit `site.config.json`:

```json
{
  "siteUrl": "https://your-domain.com",
  "title": "Your Wiki",
  "description": "...",
  "author": "Your Name"
}
```

## Build

```bash
cd site
npm install      # or bun install
npm run build    # writes dist/
```

## Deploy

`dist/` is plain HTML. Drop it on:

- GitHub Pages (workflow at `.github/workflows/wiki-publish.yml`)
- Cloudflare Pages, Netlify, Vercel
- Any static host

## Privacy gate

The build script reads frontmatter from each `wiki/**/*.md` and **only includes
pages where `privacy: public`**. Default frontmatter privacy is `private`, so
nothing publishes by accident.

`privacy: secret` pages are filtered out at the MCP server boundary too — they
never leave the box.

## Pattern

Inspired by Karpathy's [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
The publish target is one of the deltas this package adds beyond the gist's
abstract pattern.

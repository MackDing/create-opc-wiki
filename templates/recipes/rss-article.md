# Recipe: RSS / Blog Article

> Use with: `/wiki-ingest @recipes/rss-article.md <article-url>`

## When to use

- Blog posts (paulgraham.com, lesswrong, substack, dev blogs)
- News articles (NYT, Bloomberg, FT — the well-edited kind)
- Long-form essays from publications you trust

## Default frontmatter for new pages

```yaml
confidence: medium    # most blogs are opinion; bump to high only if rigorously sourced
privacy: private
sources:
  - "[[raw/articles/<filename>]]"
tags: [article]
```

## Extraction priorities

Blog and journalism content is the bread-and-butter of a personal wiki:

1. **Central claim** — strip the lead, find the actual argument
2. **Evidence vs. opinion** — separate verifiable claims from the author's interpretation
3. **Counter-narratives the author addresses** — what other views are they arguing against?
4. **Open questions or admitted uncertainty** — these are honest signals; absence is a red flag
5. **References** — every cite is a node in your knowledge graph; tag them as future ingestion candidates

## Page structure

```markdown
## Key Points
- (1-2 line punchline)

## Claim
(what the article argues, stated cleanly)

## Evidence
- (fact / data / cite 1)
- (fact / data / cite 2)

## Counter-views addressed
(what does the author argue against? are they steel-manning or strawmanning?)

## Where I disagree / want to verify
(your skeptical reading)

## To-ingest later
- [related article 1](url) — why
- [related article 2](url) — why

## My take
(opinion, speculative)
```

## Calibration: source quality

Treat sources differently:

| Source kind | Default confidence | Notes |
|-------------|-------------------|-------|
| Peer-reviewed paper | medium → high after replication | Numbers backed by data |
| Quality long-form journalism | medium | Editorial process catches some errors |
| Established blog (PG, Stratechery, etc.) | medium | Strong opinion, minimal verification |
| Substack / Medium / random | speculative | Good ideas, often unverified |
| Press release | speculative | Treat as marketing |

## Anti-patterns

- ❌ Conflate the author's interpretation with the underlying facts
- ❌ Skip "Counter-views" — articles without them are 1-sided
- ❌ Treat clicks-grabbing headlines as the actual claim
- ❌ Forget to add the article to the parent domain's `_index.md`

## See also

- [[wiki/tech/rag-vs-synthesis]] — synthesis is what makes a wiki ≠ a Notion graveyard

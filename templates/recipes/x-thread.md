# Recipe: X (Twitter) Thread

> Use with: `/wiki-ingest @recipes/x-thread.md <x-thread-url>`

## When to use

- A multi-tweet thread on X / Twitter
- Original posts from people you trust as primary sources
- Especially valuable: founders, researchers, practitioners writing in their domain of expertise

## Default frontmatter for new pages

```yaml
confidence: medium    # threads are first-person but unverified; bump to high if multi-source
privacy: private
sources:
  - "[[raw/articles/<filename>]]"   # save the raw thread first
tags: [x-thread, "@<author-handle>"]
```

## Extraction priorities

X threads compress a lot of signal in informal language. Pull out:

1. **Thesis tweet** — usually tweet #1, the headline claim
2. **Supporting evidence** — screenshots, charts, anecdotes, citations
3. **Key contrarian moves** — where does the author push back on consensus?
4. **Linked resources** — papers, tools, repos referenced
5. **Discussion signal** — top reply that adds nuance or pushes back

## Page structure

```markdown
## Key Points
- (the thesis in your own words, 1-2 lines)

## Argument
(reconstruction of the thread's logic, in flowing prose, not tweet-by-tweet quotes)

## Evidence
- (chart / number / anecdote 1)
- (chart / number / anecdote 2)

## Pushback worth tracking
- (the strongest counter-argument from the replies, if any)

## Linked resources
- [paper/tool/repo](url) — why it matters

## My take
(your opinion, mark `confidence: speculative` for inferences)
```

## Anti-patterns

- ❌ Quote every tweet verbatim — synthesize the argument instead
- ❌ Treat threads as authoritative without checking — they're commentary, not peer review
- ❌ Skip the discussion — replies often contain the most useful pushback
- ❌ Lose the link — always preserve the canonical X URL in `sources`

## Tip: capture the raw thread

X content disappears (deleted accounts, suspensions). Save the raw thread to
`raw/articles/<date>_<author>-<topic>.md` *before* distilling, including the
canonical URL. Use a service like Nitter, Thread Reader App, or just paste
the text manually.

## See also

- [[wiki/growth/personal-knowledge-management]] — how raw + compiled layers work together

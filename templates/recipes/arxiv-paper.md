# Recipe: arXiv Paper

> Use with: `/wiki-ingest @recipes/arxiv-paper.md <arxiv-url-or-pdf-path>`

## When to use

- arXiv abstract page (`https://arxiv.org/abs/...`)
- arXiv PDF (`https://arxiv.org/pdf/...`)
- Local PDF of a paper

## Default frontmatter for new pages

```yaml
domain: tech         # most papers go to tech/; if it's an econ paper, change to finance
confidence: medium   # papers are credible but pre-print; verify replication before high
privacy: private
sources:
  - "[[raw/papers/<filename>]]"
tags: [paper]
```

## Extraction priorities

When ingesting, distill these dimensions (in priority order):

1. **Headline contribution** — what is the paper claiming, in 1 sentence?
2. **Method** — the actual technique. Block diagram, algorithm, training procedure
3. **Key results** — the numbers that matter (benchmarks, ablations, scaling)
4. **Limitations** — what the paper acknowledges it can't do
5. **Citation network** — what 3-5 related works does this build on or compete with?
6. **Replication signal** — code released? checkpoints? reviewers' assessment?

## Page structure

Aim for the following sections in the new wiki article:

```markdown
## Key Points
- (1-2 line punchline of the paper)

## Contribution
(what's new vs. prior work)

## Method
(diagram or pseudocode + 3-5 bullet explanation)

## Results
| Benchmark | Prior SOTA | This paper |
|-----------|-----------|-----------|
| ...       | ...       | ...       |

## Limitations
(acknowledged failure modes / scope)

## Related work
- [[wiki/tech/<related-paper-1>]]
- [[wiki/tech/<related-paper-2>]]

## My take
(your opinion. Mark `confidence: speculative` for opinions.)
```

## Anti-patterns

- ❌ Copy-paste the abstract — that's not distillation
- ❌ Long block of equations — link to the paper for math, summarize the *idea*
- ❌ Skip "Limitations" — papers without limitations are red flags

## See also

- [[wiki/tech/llm-wiki-pattern]] — the parent pattern for compounding knowledge

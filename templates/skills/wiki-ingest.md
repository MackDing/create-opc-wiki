# wiki-ingest — Ingest new source material

Ingest new material into the personal wiki, update wiki pages.

## Usage

```
/wiki-ingest <URL>
/wiki-ingest <file-path>
/wiki-ingest @recipes/<recipe>.md <source>   # use a pre-built recipe
/wiki-ingest                                  # then paste text
```

## Steps

Follow the `/wiki-ingest` workflow defined in
`{{projectName}}/agent-rules/main.md` (or the synced `CLAUDE.md` /
`AGENTS.md` / etc.):

1. Read source material
2. Save raw material to `raw/` (articles/papers/chats/notes)
3. Identify 10-15 core concepts
4. For each concept, search existing wiki pages; enrich if exists, create if new
5. Maintain `[[wikilink]]` cross-references
6. Update domain `_index.md`, `wiki/_index.md`, `index.md` statistics
7. Append `log.md`
8. Report results

## Recipes

If a recipe is provided (e.g. `@recipes/arxiv-paper.md`), use the
recipe's extraction pattern and frontmatter defaults.

## Environment

Run from the wiki vault root, or set `PERSONAL_WIKI` to the vault path.

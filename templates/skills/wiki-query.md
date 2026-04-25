# wiki-query — Query the knowledge base

Retrieve information from the personal wiki to answer a question.

## Usage

```
/wiki-query <question>
```

## Steps

Follow the `/wiki-query` workflow in
`{{projectName}}/agent-rules/main.md`:

1. Analyze the question, determine relevant domains
2. Search `wiki/<domain>/` for related pages
3. Synthesize an answer, cite sources via `[[wikilink]]`
4. Clearly state coverage gaps
5. Ask: should this answer be saved as a new wiki page?

## Environment

Run from the wiki vault root, or set `PERSONAL_WIKI` to the vault path.

# wiki-lint — Knowledge base health check

Audit the personal wiki for contradictions, duplicates, orphans, stale
content, and frontmatter issues.

## Usage

```
/wiki-lint
```

## Steps

Follow the `/wiki-lint` workflow in `{{projectName}}/agent-rules/main.md`:

1. **Contradictions** — same topic across pages with directly conflicting claims
2. **Duplicates** — pages with >80% content overlap → suggest merge
3. **Orphans** — no `[[wikilink]]` pointing to them
4. **Staleness** — `last-updated` >60 days
5. **Frontmatter completeness** — missing required fields
6. **Index consistency** — `_index.md` lists articles that don't exist
7. **Confidence decay** — `confidence: speculative` articles with `last-updated` >30 days. Suggest:
   - upgrade to `medium` if now verified
   - keep `speculative`, bump `last-updated` to mark as reviewed
   - delete if no longer relevant

Output: structured audit report, severity-graded (must-fix / should-fix / fyi).

## Environment

Run from the wiki vault root, or set `PERSONAL_WIKI` to the vault path.

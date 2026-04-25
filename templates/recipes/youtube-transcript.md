# Recipe: YouTube Transcript

> Use with: `/wiki-ingest @recipes/youtube-transcript.md <video-url-or-transcript>`

## When to use

- Long-form interviews and lectures (Lex Fridman, Dwarkesh, MIT OpenCourseWare, etc.)
- Conference talks (NeurIPS, AI conferences, YC talks)
- Tutorial content where the *visual* matters less than the *argument*

## Getting the transcript

YouTube auto-captions are usually decent. Options:

- Click the "..." menu → "Show transcript" in YouTube web UI; copy-paste
- `yt-dlp --write-auto-sub --skip-download <url>` for batch
- Browser extensions that export transcripts to markdown

Save the raw transcript to `raw/articles/<date>_<channel>-<title>.md` first.

## Default frontmatter for new pages

```yaml
confidence: medium
privacy: private
sources:
  - "[[raw/articles/<filename>]]"
tags: [video, "<channel-name>"]
```

## Extraction priorities

Long videos have low signal density. Distill aggressively:

1. **The hook / thesis** — first 5 minutes usually frame the central claim
2. **The 3-5 most quotable insights** — pull verbatim quotes with timestamps
3. **The argument structure** — what does the speaker establish first, then build on?
4. **Concrete examples / case studies** — these are where the transferable knowledge lives
5. **Code / demos / charts shown** — note them; you may need to re-watch to capture properly
6. **Recommended further reading** — the speaker's own list

## Page structure

```markdown
## Key Points
- (3-5 bullets that are the actual takeaway)

## Argument
(your reconstruction in flowing prose)

## Quotes worth remembering
> "(verbatim quote)" — speaker, [timestamp](url-with-t-param)

> "(verbatim quote)" — speaker, [timestamp](url-with-t-param)

## Examples / case studies
(the concrete instantiations of the abstract claims)

## Visuals / demos
(re-watch needed: 12:34, 47:21 — capture later)

## My take
(your opinion, mark speculative)
```

## Anti-patterns

- ❌ Re-paste the full transcript — that's what `raw/` is for
- ❌ Quote everything — pick the 3-5 quotes you'd actually re-read
- ❌ Skip timestamps — they let you re-verify any claim in the future
- ❌ Mistake "interesting" for "useful" — entertainment ≠ knowledge

## See also

- [[wiki/growth/personal-knowledge-management]] — the spaced-distillation workflow

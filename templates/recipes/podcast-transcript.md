# Recipe: Podcast Transcript

> Use with: `/wiki-ingest @recipes/podcast-transcript.md <transcript-file-or-url>`

## When to use

- Long-form interview podcasts where ideas are debated, not just narrated
- Practitioner conversations where the *aside* often matters more than the *thesis*
- Founder / researcher / operator interviews

## Getting the transcript

- Apple Podcasts and Spotify provide auto-transcripts in many regions
- Otter.ai, Whisper (`whisper-cpp` / `whisper.cpp`), or paid services like Rev
- Some podcasts publish official transcripts — check the show's website first
- Save raw to `raw/articles/<date>_<show>-<guest>.md` before distilling

## Default frontmatter for new pages

```yaml
confidence: medium
privacy: private
sources:
  - "[[raw/articles/<filename>]]"
tags: [podcast, "<show-name>", "<guest-handle>"]
```

## Extraction priorities

Podcasts are uniquely valuable for **opinion calibration** — you hear how
practitioners disagree about live questions:

1. **Guest's central claim or framing** — the lens they bring
2. **Host's pushback** — where do they probe, and how does the guest respond?
3. **Disagreement points** — moments where the conversation gets specific about a contentious question
4. **"I changed my mind" moments** — these are gold; mark them
5. **War stories / case studies** — concrete examples reveal more than abstractions
6. **Recommendations** — books, papers, people the guest endorses (high-signal recs)

## Page structure

```markdown
## Key Points
- (the 2-3 ideas you'd repeat to a friend)

## Guest's framing
(how they see the problem, in your words)

## Where host pushed back
(the moments of productive disagreement, with your take on who was right)

## "Changed my mind" moments
- (guest used to believe X, now believes Y, because Z)

## War stories / examples
(concrete cases that anchor the abstract claims)

## Recommendations from the guest
- [book / paper / person] — why the guest values it

## My take
(opinion, mark speculative)
```

## Anti-patterns

- ❌ Treat podcast claims as data — they're opinion + lived experience, often unverified
- ❌ Skip the disagreements — the friction *is* the value
- ❌ Lose the timestamps — for any claim you might want to re-listen to, note it
- ❌ Add a page per episode — combine into the relevant topic page where possible

## Tip: combine podcasts into topic pages

If 5 different podcasts have discussed "PMF for AI tools", don't make 5
separate pages. Make one `wiki/finance/ai-tool-pmf.md` page that synthesizes
the 5 conversations into a coherent view, with sources.

## See also

- [[wiki/growth/personal-knowledge-management]] — synthesis over accumulation

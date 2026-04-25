# Security Policy

## Scope

`create-opc-wiki` is a **scaffolder**. It runs once when a user creates a
new wiki, then exits. It does not run a long-lived server, does not accept
network input at runtime, and does not call out to any external service
during scaffolding (except the optional `npm` install that the user
triggers themselves).

The **generated vault** contains two runtime components:

| Component | Trust boundary |
|---|---|
| **MCP server** (`mcp/server.mjs`) | Runs locally over stdio. Reads only `wiki/**/*.md` from the vault root. Never returns pages with `privacy: secret` in frontmatter. |
| **Static site builder** (`site/build.mjs`) | Runs locally. Reads only `wiki/**/*.md`. Writes only to `site/dist/`. Never includes pages with `privacy != "public"` in output. |

Neither component binds to a network port by default.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security reports.

Instead, use GitHub's private vulnerability reporting:

1. Go to <https://github.com/MackDing/create-opc-wiki/security/advisories>.
2. Click "Report a vulnerability".
3. Describe the issue, reproduction steps, and affected version.

We aim to respond within 5 business days.

## Privacy guarantees

The scaffolder ships three privacy primitives. These are part of the
semver-stable surface:

1. **`privacy: secret`** frontmatter — the MCP server **never** returns
   these pages. This is enforced in `loadArticles()` in the MCP server
   template, not at the client boundary.
2. **`privacy: public`** is the **only** privacy level that publishes.
   The static site builder filters out `private` and `secret` pages.
3. **Default is `private`** — pages without an explicit `privacy` field
   do not publish.

A bug in any of these three is a security issue. Please report.

## Out of scope

- The user's own wiki content. Pages written by the user (or by an LLM
  acting on the user's behalf) are the user's responsibility.
- Third-party npm dependencies. We track CVEs via Dependabot; file an
  issue if a specific CVE needs a release bump.
- The agents that integrate with the generated vault (Claude Code, Codex,
  Cursor, etc.). Report agent-specific issues to those projects.

## Supported versions

| Version | Supported |
|---|---|
| 1.x | ✅ |
| 0.x | ❌ (pre-release, use 1.x) |

Security fixes are backported only to the latest minor in the current
major.

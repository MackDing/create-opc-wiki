#!/usr/bin/env node
// MCP server for {{projectName}}.
// Exposes wiki/ as a knowledge source for any MCP client (Claude Desktop, Cursor, Codex).
//
// Tools:
//   wiki_query(query)    — keyword search across wiki articles, returns top matches
//   wiki_list(domain?)   — list articles, optionally filtered by domain
//   wiki_read(path)      — read full markdown of a specific article
//
// Privacy: articles with `privacy: secret` in frontmatter are NEVER returned.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Vault root is the parent of mcp/
const VAULT_ROOT = path.resolve(__dirname, '..');
const WIKI_DIR = path.join(VAULT_ROOT, 'wiki');

/** Read all wiki articles (markdown files). Filters out privacy: secret. */
async function loadArticles() {
  const files = await fg(['**/*.md'], { cwd: WIKI_DIR, ignore: ['_index.md'] });
  const articles = [];
  for (const rel of files) {
    const full = path.join(WIKI_DIR, rel);
    try {
      const raw = await readFile(full, 'utf-8');
      const parsed = matter(raw);
      if (parsed.data.privacy === 'secret') continue;
      articles.push({
        path: path.posix.join('wiki', rel),
        title: parsed.data.title ?? rel.replace(/\.md$/, ''),
        domain: parsed.data.domain ?? rel.split('/')[0] ?? 'unknown',
        privacy: parsed.data.privacy ?? 'private',
        confidence: parsed.data.confidence ?? 'unknown',
        body: parsed.content,
      });
    } catch (err) {
      // Skip unreadable files; don't fail the whole list.
    }
  }
  return articles;
}

/** Naive scoring: keyword count + title boost. Good enough for v0.1. */
function rank(articles, query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (terms.length === 0) return [];
  return articles
    .map((a) => {
      const hay = (a.title + '\n' + a.body).toLowerCase();
      let score = 0;
      for (const term of terms) {
        const titleHits = a.title.toLowerCase().split(term).length - 1;
        const bodyHits = a.body.toLowerCase().split(term).length - 1;
        score += titleHits * 5 + bodyHits;
      }
      return { ...a, score };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score);
}

const server = new Server(
  {
    name: '{{projectName}}-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'wiki_query',
      description:
        'Search the personal wiki for articles matching a natural-language query. Returns top matches with title, domain, and a content snippet.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (keywords)' },
          limit: {
            type: 'number',
            description: 'Max results to return (default 5)',
            default: 5,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'wiki_list',
      description: 'List wiki articles, optionally filtered by domain.',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description:
              'Filter to a specific domain (e.g. tech, finance). Omit for all.',
          },
        },
      },
    },
    {
      name: 'wiki_read',
      description:
        'Read the full markdown content of a specific wiki article by its path (e.g. wiki/tech/llm-wiki-pattern.md).',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to vault root' },
        },
        required: ['path'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'wiki_query') {
    const articles = await loadArticles();
    const ranked = rank(articles, args.query ?? '').slice(0, args.limit ?? 5);
    if (ranked.length === 0) {
      return {
        content: [{ type: 'text', text: `No matches for "${args.query}".` }],
      };
    }
    const text = ranked
      .map((a) => {
        const snippet = a.body.slice(0, 280).replace(/\s+/g, ' ');
        return `### ${a.title}\nPath: ${a.path}\nDomain: ${a.domain} | Confidence: ${a.confidence}\n\n${snippet}…`;
      })
      .join('\n\n---\n\n');
    return { content: [{ type: 'text', text }] };
  }

  if (name === 'wiki_list') {
    const articles = await loadArticles();
    const filtered = args.domain
      ? articles.filter((a) => a.domain === args.domain)
      : articles;
    if (filtered.length === 0) {
      return {
        content: [
          { type: 'text', text: 'No articles found' + (args.domain ? ` in domain "${args.domain}"` : '') + '.' },
        ],
      };
    }
    const text = filtered
      .map((a) => `- ${a.path} — ${a.title} [${a.domain}/${a.confidence}]`)
      .join('\n');
    return { content: [{ type: 'text', text }] };
  }

  if (name === 'wiki_read') {
    if (!args.path || typeof args.path !== 'string') {
      return {
        content: [{ type: 'text', text: 'Error: path is required.' }],
        isError: true,
      };
    }
    // Refuse paths trying to escape the vault.
    const resolved = path.resolve(VAULT_ROOT, args.path);
    if (!resolved.startsWith(VAULT_ROOT + path.sep)) {
      return {
        content: [{ type: 'text', text: 'Error: path escapes vault root.' }],
        isError: true,
      };
    }
    try {
      const raw = await readFile(resolved, 'utf-8');
      const parsed = matter(raw);
      if (parsed.data.privacy === 'secret') {
        return {
          content: [
            {
              type: 'text',
              text: 'This article is marked privacy: secret. The MCP server does not return secret content.',
            },
          ],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: raw }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error reading file: ${err.message}` }],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

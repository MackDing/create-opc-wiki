// Static site builder for {{projectName}}.
//
// Reads ../wiki/**/*.md, filters out anything with privacy != "public",
// and emits a minimal SEO + GEO optimized site under ./dist:
//
//   dist/
//   ├── index.html          home + JSON-LD SoftwareApplication
//   ├── <domain>/<slug>/index.html  per-page w/ OG, Twitter, JSON-LD Article, canonical
//   ├── sitemap.xml         all public URLs
//   ├── robots.txt          allow-all default; secret pages never reach here
//   ├── llms.txt            GEO surface for LLM crawlers
//   └── feed.xml            RSS 2.0 of public pages
//
// Configure via site.config.json (siteUrl, title, description, author).

import { mkdir, readFile, writeFile, readdir, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const here = path.dirname(fileURLToPath(import.meta.url));
const wikiRoot = path.resolve(here, '..', 'wiki');
const outDir = path.resolve(here, 'dist');

const config = JSON.parse(
  await readFile(path.join(here, 'site.config.json'), 'utf8'),
);
const siteUrl = (config.siteUrl ?? 'https://example.com').replace(/\/$/, '');
const siteTitle = config.title ?? '{{projectName}}';
const siteDescription =
  config.description ?? 'Personal LLM wiki built with create-opc-wiki.';
const siteAuthor = config.author ?? 'Anonymous';

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && e.name.endsWith('.md')) yield full;
  }
}

const pages = [];
if (existsSync(wikiRoot)) {
  for await (const file of walk(wikiRoot)) {
    const rel = path.relative(wikiRoot, file);
    if (path.basename(file) === '_index.md') continue; // domain index, skip
    const raw = await readFile(file, 'utf8');
    const parsed = matter(raw);
    const fm = parsed.data ?? {};
    if ((fm.privacy ?? 'private') !== 'public') continue; // privacy gate
    const slug = rel.replace(/\.md$/, '').split(path.sep).join('/');
    pages.push({
      slug,
      title: fm.title ?? slug,
      description: fm.description ?? firstParagraph(parsed.content),
      domain: fm.domain ?? rel.split(path.sep)[0] ?? 'wiki',
      created: fm.created ?? null,
      lastUpdated: fm['last-updated'] ?? fm.lastUpdated ?? fm.created ?? null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      content: parsed.content,
    });
  }
}

function firstParagraph(text) {
  const para = text.split(/\n\s*\n/).find((p) => p.trim().length > 0) ?? '';
  return para.replace(/\s+/g, ' ').trim().slice(0, 280);
}

function escHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escXml(s) {
  return escHtml(s);
}

function pageHtml(page) {
  const url = `${siteUrl}/${page.slug}/`;
  const desc = page.description ?? siteDescription;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: desc,
    author: { '@type': 'Person', name: siteAuthor },
    datePublished: page.created,
    dateModified: page.lastUpdated,
    mainEntityOfPage: url,
    keywords: page.tags.join(', '),
  };
  const body = marked.parse(page.content);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escHtml(page.title)} — ${escHtml(siteTitle)}</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="${escHtml(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escHtml(page.title)}">
<meta property="og:description" content="${escHtml(desc)}">
<meta property="og:url" content="${escHtml(url)}">
<meta property="og:site_name" content="${escHtml(siteTitle)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escHtml(page.title)}">
<meta name="twitter:description" content="${escHtml(desc)}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>body{font-family:system-ui,sans-serif;max-width:42em;margin:2em auto;padding:0 1em;line-height:1.6}code{background:#f3f3f3;padding:1px 4px;border-radius:3px}pre{background:#f3f3f3;padding:1em;overflow-x:auto}</style>
</head>
<body>
<nav><a href="${siteUrl}/">← ${escHtml(siteTitle)}</a></nav>
<article>
<header><h1>${escHtml(page.title)}</h1>
<p><small>Domain: ${escHtml(page.domain)} · Last updated: ${escHtml(page.lastUpdated ?? '—')}</small></p></header>
${body}
</article>
</body>
</html>`;
}

function indexHtml() {
  const byDomain = new Map();
  for (const p of pages) {
    if (!byDomain.has(p.domain)) byDomain.set(p.domain, []);
    byDomain.get(p.domain).push(p);
  }
  const sections = [];
  for (const [domain, list] of byDomain) {
    sections.push(`<h2>${escHtml(domain)}</h2><ul>`);
    for (const p of list.sort((a, b) => a.title.localeCompare(b.title))) {
      sections.push(
        `<li><a href="/${escHtml(p.slug)}/">${escHtml(p.title)}</a> — ${escHtml(p.description ?? '')}</li>`,
      );
    }
    sections.push('</ul>');
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteTitle,
    description: siteDescription,
    url: siteUrl,
    author: { '@type': 'Person', name: siteAuthor },
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escHtml(siteTitle)}</title>
<meta name="description" content="${escHtml(siteDescription)}">
<link rel="canonical" href="${escHtml(siteUrl)}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${escHtml(siteTitle)}">
<meta property="og:description" content="${escHtml(siteDescription)}">
<meta property="og:url" content="${escHtml(siteUrl)}/">
<link rel="alternate" type="application/rss+xml" title="${escHtml(siteTitle)}" href="${escHtml(siteUrl)}/feed.xml">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>body{font-family:system-ui,sans-serif;max-width:42em;margin:2em auto;padding:0 1em;line-height:1.6}</style>
</head>
<body>
<h1>${escHtml(siteTitle)}</h1>
<p>${escHtml(siteDescription)}</p>
<p><small>Inspired by <a href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f">Andrej Karpathy's LLM Wiki gist</a>.</small></p>
${sections.join('\n')}
<footer><p><small>${pages.length} public pages · <a href="/feed.xml">RSS</a> · <a href="/llms.txt">llms.txt</a> · <a href="/sitemap.xml">sitemap</a></small></p></footer>
</body>
</html>`;
}

function sitemapXml() {
  const urls = [
    `<url><loc>${siteUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...pages.map(
      (p) =>
        `<url><loc>${siteUrl}/${escXml(p.slug)}/</loc>` +
        (p.lastUpdated ? `<lastmod>${escXml(p.lastUpdated)}</lastmod>` : '') +
        `<changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function llmsTxt() {
  // Spec: https://llmstxt.org/
  const lines = [
    `# ${siteTitle}`,
    '',
    `> ${siteDescription}`,
    '',
    'This site is a personal LLM wiki built with [create-opc-wiki](https://github.com/MackDing/create-opc-wiki),',
    'which operationalizes the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).',
    'Only pages with `privacy: public` in frontmatter appear here.',
    '',
    '## Pages',
    '',
  ];
  for (const p of pages) {
    const url = `${siteUrl}/${p.slug}/`;
    const desc = p.description ? `: ${p.description}` : '';
    lines.push(`- [${p.title}](${url})${desc}`);
  }
  lines.push('', '## Feeds', '', `- [RSS](${siteUrl}/feed.xml)`, `- [Sitemap](${siteUrl}/sitemap.xml)`);
  return lines.join('\n') + '\n';
}

function feedXml() {
  const items = pages
    .slice()
    .sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''))
    .slice(0, 50)
    .map(
      (p) => `<item>
<title>${escXml(p.title)}</title>
<link>${siteUrl}/${escXml(p.slug)}/</link>
<guid isPermaLink="true">${siteUrl}/${escXml(p.slug)}/</guid>
${p.lastUpdated ? `<pubDate>${escXml(new Date(p.lastUpdated).toUTCString())}</pubDate>` : ''}
<description>${escXml(p.description ?? '')}</description>
</item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escXml(siteTitle)}</title>
<link>${siteUrl}/</link>
<description>${escXml(siteDescription)}</description>
${items}
</channel>
</rss>`;
}

// Build
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), indexHtml());
for (const p of pages) {
  const dir = path.join(outDir, p.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), pageHtml(p));
}
await writeFile(path.join(outDir, 'sitemap.xml'), sitemapXml());
await writeFile(path.join(outDir, 'robots.txt'), robotsTxt());
await writeFile(path.join(outDir, 'llms.txt'), llmsTxt());
await writeFile(path.join(outDir, 'feed.xml'), feedXml());

console.log(
  `Built ${pages.length} pages → ${outDir} (sitemap.xml, robots.txt, llms.txt, feed.xml)`,
);

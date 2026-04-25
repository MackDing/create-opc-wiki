{
  "name": "{{projectName}}-site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Static site target for {{projectName}}. Emits SEO + GEO surfaces (sitemap.xml, llms.txt, robots.txt, RSS, OpenGraph, JSON-LD).",
  "scripts": {
    "build": "node ./build.mjs",
    "preview": "node ./preview.mjs",
    "dev": "node ./build.mjs && node ./preview.mjs"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "marked": "^14.0.0"
  }
}

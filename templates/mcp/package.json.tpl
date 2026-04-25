{
  "name": "{{projectName}}-mcp",
  "version": "0.1.0",
  "private": true,
  "description": "MCP server exposing the {{projectName}} wiki to MCP clients (Claude Desktop, Cursor, Codex)",
  "type": "module",
  "bin": {
    "{{projectName}}-mcp": "./server.mjs"
  },
  "scripts": {
    "start": "node ./server.mjs"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.0",
    "fast-glob": "^3.3.3",
    "gray-matter": "^4.0.3",
    "zod": "^3.25.76"
  }
}

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const codexMd = path.join(ROOT, 'codex.md');

const guide = `# Codex Guide for this repo

This repository is prepared for **OpenAI Codex CLI**.

## What Codex should know
- Uses **Responsible Vibe MCP** to drive structured workflows.
- MCP server starts via \`npx responsible-vibe-mcp\`.
- Follow repo workflows before generating code.

## Common tasks
- "Start the waterfall workflow for a new feature"
- "Generate unit tests for the last change"
`;

const toml = `# ---- Add to ~/.codex/config.toml ----
[mcp_servers.responsible-vibe-mcp]
command = "npx"
args    = ["responsible-vibe-mcp"]
env     = { NODE_OPTIONS = "" }
# -------------------------------------`;

if (!fs.existsSync(codexMd)) {
  fs.writeFileSync(codexMd, guide, 'utf8');
  console.log(`✓ wrote ${path.relative(ROOT, codexMd)}`);
} else {
  console.log(`i ${path.relative(ROOT, codexMd)} exists; keeping as-is`);
}
console.log("\nAdd this to ~/.codex/config.toml:\n");
console.log(toml + "\n");
console.log("Notes:");
console.log("- Ubuntu/WSL: install Codex CLI with `npm i -g @openai/codex` (or binary).");
console.log("- iOS: local CLI MCP is not available on-device; run the MCP server on a remote dev box/Codespaces.");

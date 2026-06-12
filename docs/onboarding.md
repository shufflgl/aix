# Ext Onboarding Guide

An `aix` ext is standardized source that can generate Codex plugins, Claude Code plugins, Claude Desktop extensions, and connector templates.

## Required source assets

Every ext needs:

- `manifests/<ext-id>.yaml`: canonical metadata, MCP path, skill list, env schema, and target support.
- `mcp/<ext-id>/`: stdio MCP source. Current generators expect a buildable Node package.

Optional assets:

- `skills/<ext-id>/`: skill workflow and references.
- `assets/<ext-id>/`: logos, icons, screenshots, and other reusable visual assets.

## Create a new ext

```bash
node cli/dist/index.js ext create notion \
  --kind mcp+skill \
  --description "Use Notion from AI agents" \
  --env NOTION_API_KEY:secret:required \
  --target codex \
  --target claude-code \
  --json
```

Then ask an agent to implement the MCP using:

```bash
node cli/dist/index.js prompt create-mcp notion
```

## Import an existing ext

For now, use the prompt workflow:

```bash
node cli/dist/index.js prompt import-ext
```

The import goal is to extract stable source into `mcp/`, `skills/`, `assets/`, and `manifests/`. Platform packages stay generated.

## Validate onboarding

```bash
npm run build
node cli/dist/index.js ext build <ext-id> --target codex --json
node cli/dist/index.js ext doctor <ext-id> --target codex --json
```

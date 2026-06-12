# aix Agent Guide

`aix` is a deterministic CLI for AI agents to manage ext assets across Codex, Claude Code, and Claude Desktop. Do not treat `aix` as an AI chatbot; use it as a safe, scriptable operations tool.

## Setup

When a user gives you this repo and asks to use it:

```bash
npm install
npm run build
node cli/dist/index.js ext list --json
```

Prefer `node cli/dist/index.js` unless the package has already been linked with `npm link --workspace cli`.

## Source vs Generated Outputs

Source of truth:

- `aix.yaml`
- `manifests/`
- `mcp/`
- `skills/`
- `assets/`
- `cli/`

Generated outputs:

- `platforms/codex/plugins/*`
- `platforms/claude-code/plugins/*`
- `platforms/claude-desktop/extensions/*`
- `platforms/claude-desktop/connectors/*`
- `dist/`

Do not manually edit generated outputs. Regenerate them with `aix ext build`.

## Agent-Friendly Usage

Prefer JSON for inspection:

```bash
node cli/dist/index.js ext list --json
node cli/dist/index.js ext doctor gpt-image-2 --target codex --json
node cli/dist/index.js secret check gpt-image-2 --backend env --json
node cli/dist/index.js status --json
```

Before mutating system state, run dry-run first:

```bash
node cli/dist/index.js ext install gpt-image-2 --target codex --dry-run --json
node cli/dist/index.js ext remove gpt-image-2 --target codex --dry-run --json
```

Then apply only after the user confirms or explicitly requested installation:

```bash
node cli/dist/index.js ext install gpt-image-2 --target codex --json
```

## Secrets Safety

Never ask the user to paste API keys into chat. Use one of:

```bash
node cli/dist/index.js secret init gpt-image-2 --backend env
node cli/dist/index.js secret edit gpt-image-2 --backend env
node cli/dist/index.js secret init gpt-image-2 --backend keychain
node cli/dist/index.js secret init gpt-image-2 --backend 1password
```

For keychain values, the user should run the command locally if it includes a secret value.

## Common Workflows

Install GPT Image 2 for Codex:

```bash
node cli/dist/index.js ext install gpt-image-2 --target codex --dry-run --json
node cli/dist/index.js ext install gpt-image-2 --target codex --json
node cli/dist/index.js ext doctor gpt-image-2 --target codex --json
```

Build Claude Desktop MCPB:

```bash
node cli/dist/index.js ext build gpt-image-2 --target claude-desktop --json
```

Initialize workspace metadata:

```bash
node cli/dist/index.js init --force --json \
  --project-name aix \
  --publisher-name shufflgl \
  --publisher-email hi@lglgl.me \
  --publisher-url https://github.com/shufflgl \
  --repository https://github.com/shufflgl/aix
```

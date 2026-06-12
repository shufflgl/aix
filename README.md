# aix

`aix` is an AI Extensions Manager for maintaining shared MCP servers, skills, and platform adapters across Codex, Claude Code, and Claude Desktop.

## Repository Layout

```text
mcp/                         Shared MCP server source
skills/                      Shared skill source
manifests/                   Canonical extension manifests
platforms/codex/plugins/     Generated Codex plugin adapters
platforms/claude-code/       Generated Claude Code plugin adapters
platforms/claude-desktop/    Generated Desktop extensions/connectors
cli/                         aix CLI implementation
```

`platforms/*` directories are generated outputs. Source of truth lives in `manifests/`, `mcp/`, `skills/`, and `cli/`.

## MVP Scope

The current implementation supports:

- Codex plugin generation and installation
- Claude Code plugin generation and file-level installation
- Claude Desktop MCPB extension generation
- Claude connector template generation

## Usage

```bash
npm install
npm run build
node cli/dist/index.js list
node cli/dist/index.js doctor gpt-image-2 --target codex
node cli/dist/index.js build gpt-image-2 --all
node cli/dist/index.js install gpt-image-2 --target codex
node cli/dist/index.js status
```

After linking the CLI package, use `aix` directly:

```bash
npm link --workspace cli
aix install gpt-image-2 --target codex
aix build gpt-image-2 --target claude-code
aix build gpt-image-2 --target claude-desktop
aix build gpt-image-2 --target claude-connector
```


## Workspace Metadata

Workspace-level metadata lives in `aix.yaml` and is inherited by generated platform adapters.

```bash
node cli/dist/index.js init --force \
  --project-name aix \
  --publisher-name shufflgl \
  --publisher-email hi@lglgl.me \
  --publisher-url https://github.com/shufflgl \
  --repository https://github.com/shufflgl/aix

node cli/dist/index.js config show
node cli/dist/index.js config get publisher.email
node cli/dist/index.js config set defaults.brandColor '#7C3AED'
```

Merge precedence is platform-specific fields, then extension manifest fields, then `aix.yaml` defaults.

## Codex Install Target

The Codex adapter installs generated plugins to:

```text
~/.codex/plugins/local/<extension-id>
```

It updates the personal marketplace at:

```text
~/.agents/plugins/marketplace.json
```

For `gpt-image-2`, configure credentials in:

```text
~/.codex/plugins/local/gpt-image-2/.env
```

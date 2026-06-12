# aix

`aix` is an AI Extensions Manager for maintaining shared MCP servers, skills, and platform adapters across Codex, Claude Code, and Claude Desktop.


## Agent Quickstart

`aix` is designed to be called by Codex or Claude Code as a deterministic CLI. Agents should prefer JSON output and dry-runs before mutating system state.

```bash
npm install
npm run build
node cli/dist/index.js ext list --json
node cli/dist/index.js ext install gpt-image-2 --target codex --dry-run --json
node cli/dist/index.js ext install gpt-image-2 --target codex --json
node cli/dist/index.js ext doctor gpt-image-2 --target codex --json
```

See `AGENTS.md` and `CLAUDE.md` for agent-specific operating instructions.

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
node cli/dist/index.js ext list
node cli/dist/index.js ext doctor gpt-image-2 --target codex
node cli/dist/index.js ext build gpt-image-2 --all
node cli/dist/index.js ext install gpt-image-2 --target codex
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



## Creating and Onboarding Exts

Use `ext create` to create standardized source skeletons before asking an agent to implement details:

```bash
node cli/dist/index.js ext create my-ext --kind mcp+skill --env API_KEY:secret:required --target codex --json
node cli/dist/index.js prompt create-mcp my-ext
```

For existing local work, use the import guidance prompt:

```bash
node cli/dist/index.js prompt import-ext
```

See `docs/onboarding.md` for the full source-vs-generated onboarding workflow.

## Secret Backends

`aix` supports three optional secret backends for aix-managed ext credentials:

- `.env` files under `~/.aix/secrets/<ext-id>.env`
- macOS Keychain entries under service `aix:<ext-id>`
- 1Password reference files under `~/.aix/secrets/<ext-id>.1password.env`

`~/.aix/secrets` is an optional shared store. Generated plugin launchers never create `~/.aix`, `~/.aix/secrets`, or secret files. Those paths are created only when the user explicitly runs `aix secret ...`.

For standalone plugin use, configure the plugin-local `.env` file in the platform install directory. For aix-managed use, initialize a shared secret backend:

```bash
node cli/dist/index.js secret init gpt-image-2 --backend env
node cli/dist/index.js secret path gpt-image-2 --backend env
node cli/dist/index.js secret check gpt-image-2 --backend env
```

Store a value in macOS Keychain:

```bash
node cli/dist/index.js secret set gpt-image-2 --backend keychain --key OPENAI_API_KEY --value '<key>'
node cli/dist/index.js secret check gpt-image-2 --backend keychain
```

Create a 1Password reference template:

```bash
node cli/dist/index.js secret init gpt-image-2 --backend 1password
node cli/dist/index.js secret check gpt-image-2 --backend 1password
```

Generated MCP launchers read existing configuration only, in this order:

```text
platform install directory .env
~/.aix/secrets/<ext-id>.env, if it already exists
~/.aix/secrets/<ext-id>.1password.env, if it already exists
macOS Keychain service aix:<ext-id>
```

Existing process environment variables still win because launchers do not overwrite already-set variables.

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

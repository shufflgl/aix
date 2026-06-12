# Import an existing local ext into aix

You are working in the `aix` repo. Normalize an existing local MCP, skill, Codex plugin, Claude Code plugin, or Claude Desktop extension into aix source assets.

Rules:

1. Extract reusable source into `mcp/<ext-id>/`, `skills/<ext-id>/`, and `assets/<ext-id>/`.
2. Create or update `manifests/<ext-id>.yaml` as the single ext manifest.
3. Do not commit generated outputs from `platforms/*` or `dist/*`.
4. Preserve env requirements in the manifest `env` block.
5. Preserve plugin/extension logos in `assets/<ext-id>/` and reference them from the manifest.
6. Validate with:

```bash
npm run build
node cli/dist/index.js ext build <ext-id> --all --json
node cli/dist/index.js ext doctor <ext-id> --target codex --json
```

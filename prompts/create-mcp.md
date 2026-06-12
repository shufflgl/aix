# Create an aix MCP ext: {{extId}}

You are working in the `aix` repo. Implement the MCP source for ext `{{extId}}`.

Rules:

1. Treat these as source of truth: `manifests/{{extId}}.yaml`, `mcp/{{extId}}/`, `skills/`, `assets/`.
2. Do not manually edit `platforms/*` or `dist/*`; they are generated outputs.
3. Add MCP tools in `mcp/{{extId}}/src/` and keep the server stdio-compatible.
4. Update `manifests/{{extId}}.yaml` with `mcp.tools` and required `env` entries.
5. Mark secret env vars with `secret: true`; mark required vars with `required: true`.
6. Run:

```bash
npm run build
node cli/dist/index.js ext build {{extId}} --target codex --json
node cli/dist/index.js ext doctor {{extId}} --target codex --json
```

Return a concise summary of changed source files and validation results.

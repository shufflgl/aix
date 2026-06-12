# Create an aix Skill ext: {{extId}}

You are working in the `aix` repo. Implement or refine the skill for ext `{{extId}}`.

Rules:

1. Write skill source under `skills/{{extId}}/`.
2. Keep `SKILL.md` frontmatter valid with `name` and `description`.
3. Put reusable scripts under `skills/{{extId}}/scripts/` and references under `skills/{{extId}}/references/`.
4. Update `manifests/{{extId}}.yaml` `skills` list if needed.
5. Do not manually edit `platforms/*` or `dist/*`.
6. Run:

```bash
npm run build
node cli/dist/index.js ext build {{extId}} --target codex --json
```

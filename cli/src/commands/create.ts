import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { printResponse } from "../core/output.js";
import { workspaceRoot } from "../core/paths.js";

const VALID_KINDS = new Set(["mcp", "skill", "mcp+skill"]);

interface CreateOptions {
  kind?: string;
  runtime?: string;
  description?: string;
  target?: string[] | string;
  env?: string[] | string;
  dryRun?: boolean;
  json?: boolean;
  force?: boolean;
}

export async function createCommand(extensionId: string, options: CreateOptions = {}): Promise<void> {
  const id = normalizeId(extensionId);
  const kind = options.kind ?? "mcp+skill";
  if (!VALID_KINDS.has(kind)) throw new Error(`Unsupported kind: ${kind}. Use mcp, skill, or mcp+skill.`);
  const runtime = options.runtime ?? "node";
  if (runtime !== "node") throw new Error("MVP ext create currently supports --runtime node only.");

  const root = workspaceRoot();
  const manifestPath = path.join(root, "manifests", `${id}.yaml`);
  const mcpPath = path.join(root, "mcp", id);
  const skillPath = path.join(root, "skills", id);
  const actions = [
    { type: "write", description: "Create extension manifest", path: manifestPath },
    { type: "write", description: "Create Node MCP skeleton", path: mcpPath },
    ...(kind.includes("skill") ? [{ type: "write", description: "Create skill skeleton", path: skillPath }] : [])
  ];

  if (options.dryRun) {
    printResponse({ ok: true, data: { extension: id, kind, runtime }, actions }, options.json);
    return;
  }

  for (const output of [manifestPath, mcpPath, ...(kind.includes("skill") ? [skillPath] : [])]) {
    if ((await fs.pathExists(output)) && !options.force) throw new Error(`${output} already exists. Use --force to overwrite.`);
  }

  await writeNodeMcpSkeleton(id, mcpPath);
  if (kind.includes("skill")) await writeSkillSkeleton(id, skillPath, options.description);
  await fs.ensureDir(path.dirname(manifestPath));
  await fs.writeFile(manifestPath, YAML.stringify(buildManifest(id, kind, options)));

  printResponse({
    ok: true,
    data: { extension: id, kind, runtime, manifestPath },
    actions,
    nextActions: [
      { description: "Implement MCP tools", command: `aix prompt create-mcp ${id}` },
      { description: "Validate the ext", command: `aix ext doctor ${id} --target codex --json` },
      { description: "Build a platform adapter", command: `aix ext build ${id} --target codex --json` }
    ]
  }, options.json, `Created ext ${id} (${kind})`);
}

function buildManifest(id: string, kind: string, options: CreateOptions) {
  const targets = normalizeList(options.target ?? ["codex", "claude-code"]);
  return {
    id,
    name: titleCase(id),
    version: "0.1.0",
    description: options.description ?? `${titleCase(id)} extension`,
    mcp: {
      id,
      path: `mcp/${id}`,
      type: "stdio",
      runtime: "node",
      command: "node",
      args: ["dist/index.js"],
      build: ["npm ci", "npm run build"],
      tools: []
    },
    skills: kind.includes("skill") ? [id] : [],
    env: parseEnvSpecs(options.env),
    targets: {
      codex: { enabled: targets.includes("codex"), plugin: true, marketplace: "personal", installPath: `~/.codex/plugins/local/${id}`, marketplacePath: "~/.agents/plugins/marketplace.json" },
      claudeCode: { enabled: targets.includes("claude-code"), plugin: true, installPath: `~/.claude/plugins/local/${id}` },
      claudeDesktop: { enabled: targets.includes("claude-desktop"), extension: true, connector: false, extensionPath: `~/Library/Application Support/Claude/Extensions/${id}` }
    }
  };
}

async function writeNodeMcpSkeleton(id: string, mcpPath: string): Promise<void> {
  await fs.remove(mcpPath);
  await fs.ensureDir(path.join(mcpPath, "src"));
  await fs.writeJson(path.join(mcpPath, "package.json"), {
    name: id,
    version: "0.1.0",
    private: true,
    type: "module",
    main: "dist/index.js",
    scripts: { build: "tsc -p tsconfig.json", start: "node dist/index.js" },
    dependencies: { "@modelcontextprotocol/sdk": "^1.17.0", zod: "^3.24.0" },
    devDependencies: { "@types/node": "^22.0.0", typescript: "^5.6.0" },
    engines: { node: ">=20" }
  }, { spaces: 2 });
  await fs.writeJson(path.join(mcpPath, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: "dist",
      rootDir: "src"
    },
    include: ["src/**/*.ts"]
  }, { spaces: 2 });
  await fs.writeFile(path.join(mcpPath, "src", "index.ts"), `#!/usr/bin/env node\nimport { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\nimport { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";\n\nconst server = new McpServer({ name: "${id}", version: "0.1.0" });\n\n// TODO: register tools here. Update manifests/${id}.yaml mcp.tools after adding tools.\n\nawait server.connect(new StdioServerTransport());\n`);
  await fs.writeFile(path.join(mcpPath, "README.md"), `# ${titleCase(id)} MCP\n\nTODO: describe tools and configuration.\n`);
}

async function writeSkillSkeleton(id: string, skillPath: string, description?: string): Promise<void> {
  await fs.remove(skillPath);
  await fs.ensureDir(skillPath);
  await fs.writeFile(path.join(skillPath, "SKILL.md"), `---\nname: ${id}\ndescription: ${description ?? `Use when working with ${titleCase(id)}.`}\n---\n\n# ${titleCase(id)}\n\nTODO: describe when to use this skill, required inputs, workflow, and validation steps.\n`);
}

function parseEnvSpecs(raw?: string[] | string): Record<string, { required: boolean; secret: boolean; default?: string }> {
  const env: Record<string, { required: boolean; secret: boolean; default?: string }> = {};
  for (const spec of normalizeList(raw ?? [])) {
    const [name, ...flags] = spec.split(":");
    if (!name) continue;
    env[name] = { required: flags.includes("required"), secret: flags.includes("secret") };
  }
  return env;
}

function normalizeList(value: string[] | string): string[] {
  return Array.isArray(value) ? value : [value];
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function titleCase(id: string): string {
  return id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

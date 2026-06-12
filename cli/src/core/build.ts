import fs from "fs-extra";
import path from "node:path";
import { ExtensionManifest } from "./manifest.js";
import { workspaceRoot } from "./paths.js";
import { runCommand } from "../utils/shell.js";

export async function copyAndBuildMcp(manifest: ExtensionManifest, serverDir: string): Promise<void> {
  const mcpSource = path.join(workspaceRoot(), manifest.mcp.path);
  await fs.ensureDir(serverDir);
  await fs.copy(mcpSource, serverDir, {
    filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`) && !source.includes(`${path.sep}dist${path.sep}`)
  });
  for (const command of manifest.mcp.build) {
    await runCommand(command, serverDir);
  }
}

export async function copySkills(manifest: ExtensionManifest, destinationRoot: string): Promise<void> {
  await fs.ensureDir(destinationRoot);
  for (const skill of manifest.skills) {
    const skillSource = path.join(workspaceRoot(), "skills", skill);
    if (await fs.pathExists(skillSource)) {
      await fs.copy(skillSource, path.join(destinationRoot, skill));
    }
  }
}

export function envExample(manifest: ExtensionManifest): string {
  return Object.entries(manifest.env)
    .map(([key, value]) => `${key}=${value.default ?? ""}`)
    .join("\n") + "\n";
}

export function defaultNonSecretEnv(manifest: ExtensionManifest): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(manifest.env)) {
    if (value.default !== undefined && !value.secret) env[key] = String(value.default);
  }
  return env;
}

export function launcherScript(): string {
  return `#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(scriptDir);
const envPath = join(packageRoot, ".env");
const serverEntry = join(packageRoot, "server", "dist", "index.js");

if (existsSync(envPath)) {
  const contents = readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\\r?\\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^[ '\"]|[ '\"]$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

if (!existsSync(serverEntry)) {
  console.error(\`Missing MCP server build at \${serverEntry}.\`);
  process.exit(1);
}

await import(serverEntry);
`;
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

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

export function launcherScript(extensionId = "", secretKeys: string[] = []): string {
  return `#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const extensionId = ${JSON.stringify(extensionId)};
const secretKeys = ${JSON.stringify(secretKeys)};
const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(scriptDir);
const localEnvPath = join(packageRoot, ".env");
const sharedEnvPath = extensionId ? join(homedir(), ".aix", "secrets", extensionId + ".env") : "";
const onePasswordEnvPath = extensionId ? join(homedir(), ".aix", "secrets", extensionId + ".1password.env") : "";
const serverEntry = join(packageRoot, "server", "dist", "index.js");

loadEnvFile(localEnvPath, false);
loadEnvFile(sharedEnvPath, false);
loadOnePasswordRefs(onePasswordEnvPath);
loadKeychainSecrets(extensionId);

if (!existsSync(serverEntry)) {
  console.error(\`Missing MCP server build at \${serverEntry}.\`);
  process.exit(1);
}

await import(serverEntry);

function loadEnvFile(filePath, override) {
  // Read-only: standalone plugins must not create ~/.aix or any secret files.
  if (!filePath || !existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\\r?\\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^[ '\"]|[ '\"]$/g, "");
    if (key && (override || process.env[key] == null) && value) process.env[key] = value;
  }
}

function loadOnePasswordRefs(filePath) {
  // Read-only: only use aix-managed 1Password refs when the file already exists.
  if (!filePath || !existsSync(filePath)) return;
  try {
    execFileSync("op", ["--version"], { stdio: "ignore" });
  } catch {
    return;
  }
  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\\r?\\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const ref = line.slice(equalsIndex + 1).trim();
    if (!key || !ref.startsWith("op://") || process.env[key] != null) continue;
    try {
      process.env[key] = execFileSync("op", ["read", ref], { encoding: "utf8" }).trim();
    } catch {
      // Ignore unresolved 1Password refs; the MCP server will report missing required values.
    }
  }
}

function loadKeychainSecrets(extId) {
  // Read-only: querying Keychain does not create ~/.aix or plugin-local files.
  if (!extId) return;
  const envKeys = Object.keys(process.env).filter((key) => key.endsWith("_API_KEY") || key.endsWith("_TOKEN"));
  for (const key of new Set([...secretKeys, ...envKeys, "OPENAI_API_KEY", "OPENAI_BASE_URL"])) {
    if (process.env[key] != null) continue;
    try {
      const value = execFileSync("security", ["find-generic-password", "-s", "aix:" + extId, "-a", key, "-w"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      if (value) process.env[key] = value;
    } catch {
      // Ignore missing keychain entries.
    }
  }
}
`;
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

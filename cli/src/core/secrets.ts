import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import { ExtensionManifest } from "./manifest.js";
import { commandExists } from "../utils/shell.js";

export type SecretBackend = "env" | "keychain" | "1password";

export function secretsDir(): string {
  return path.join(os.homedir(), ".aix", "secrets");
}

export function envSecretPath(extensionId: string): string {
  return path.join(secretsDir(), `${extensionId}.env`);
}

export function onePasswordRefPath(extensionId: string): string {
  return path.join(secretsDir(), `${extensionId}.1password.env`);
}

export function keychainService(extensionId: string): string {
  return `aix:${extensionId}`;
}

export async function initEnvSecrets(manifest: ExtensionManifest, force = false): Promise<string> {
  const file = envSecretPath(manifest.id);
  await fs.ensureDir(path.dirname(file));
  if ((await fs.pathExists(file)) && !force) return file;
  const contents = Object.entries(manifest.env)
    .map(([key, value]) => `${key}=${value.default ?? ""}`)
    .join("\n") + "\n";
  await fs.writeFile(file, contents, { mode: 0o600 });
  await fs.chmod(file, 0o600);
  return file;
}

export async function initOnePasswordRefs(manifest: ExtensionManifest, force = false): Promise<string> {
  const file = onePasswordRefPath(manifest.id);
  await fs.ensureDir(path.dirname(file));
  if ((await fs.pathExists(file)) && !force) return file;
  const contents = Object.entries(manifest.env)
    .map(([key, value]) => `${key}=${value.secret ? `op://Private/${manifest.id}/${key}` : value.default ?? ""}`)
    .join("\n") + "\n";
  await fs.writeFile(file, contents, { mode: 0o600 });
  await fs.chmod(file, 0o600);
  return file;
}

export async function setKeychainSecret(extensionId: string, key: string, value: string): Promise<void> {
  await execa("security", ["add-generic-password", "-U", "-s", keychainService(extensionId), "-a", key, "-w", value]);
}

export async function getKeychainSecret(extensionId: string, key: string): Promise<string | undefined> {
  try {
    const result = await execa("security", ["find-generic-password", "-s", keychainService(extensionId), "-a", key, "-w"]);
    return result.stdout;
  } catch {
    return undefined;
  }
}

export async function checkSecrets(manifest: ExtensionManifest, backend: SecretBackend): Promise<Array<{ key: string; status: string }>> {
  if (backend === "env") {
    return checkSecretsFromValues(manifest, await readEnvFile(envSecretPath(manifest.id)));
  }
  const rows: Array<{ key: string; status: string }> = [];
  for (const [key, spec] of Object.entries(manifest.env)) {
    if (backend === "keychain") {
      const value = await getKeychainSecret(manifest.id, key);
      rows.push({ key, status: value ? "set" : spec.required ? "missing" : spec.default !== undefined ? "default" : "optional" });
    } else {
      const opAvailable = await commandExists("op");
      const values = await readEnvFile(onePasswordRefPath(manifest.id));
      const hasRef = Boolean(values[key]);
      rows.push({ key, status: !opAvailable ? "op-missing" : hasRef ? "ref" : spec.required ? "missing" : "optional" });
    }
  }
  return rows;
}

export async function checkLocalEnvSecrets(manifest: ExtensionManifest, localEnvPath: string): Promise<Array<{ key: string; status: string }>> {
  return checkSecretsFromValues(manifest, await readEnvFile(localEnvPath));
}

function checkSecretsFromValues(manifest: ExtensionManifest, values: Record<string, string>): Array<{ key: string; status: string }> {
  const rows: Array<{ key: string; status: string }> = [];
  for (const [key, spec] of Object.entries(manifest.env)) {
    rows.push({ key, status: values[key] ? "set" : spec.required ? "missing" : spec.default !== undefined ? "default" : "optional" });
  }
  return rows;
}

export async function readEnvFile(file: string): Promise<Record<string, string>> {
  if (!(await fs.pathExists(file))) return {};
  const raw = await fs.readFile(file, "utf8");
  const values: Record<string, string> = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    values[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^[ '\"]|[ '\"]$/g, "");
  }
  return values;
}

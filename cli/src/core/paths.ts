import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function workspaceRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../../..");
}

export function expandHome(input: string): string {
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

export function codexLocalPluginPath(extensionId: string): string {
  return path.join(os.homedir(), ".codex", "plugins", "local", extensionId);
}

export function personalMarketplacePath(): string {
  return path.join(os.homedir(), ".agents", "plugins", "marketplace.json");
}

export function statePath(): string {
  return path.join(os.homedir(), ".aix", "state.json");
}

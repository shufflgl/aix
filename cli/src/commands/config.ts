import YAML from "yaml";
import { getConfigValue, loadWorkspaceConfig, setConfigValue, writeWorkspaceConfig } from "../core/workspace-config.js";
import { printResponse } from "../core/output.js";

export async function configCommand(action: string | undefined, key?: string, value?: string, options: { json?: boolean } = {}): Promise<void> {
  const config = await loadWorkspaceConfig();
  if (!action || action === "show") {
    printResponse({ ok: true, data: { config } }, options.json, YAML.stringify(config));
    return;
  }
  if (action === "get") {
    if (!key) throw new Error("config get requires a key path");
    const result = getConfigValue(config, key);
    printResponse({ ok: result !== undefined, data: { key, value: result } }, options.json, typeof result === "object" ? YAML.stringify(result) : result !== undefined ? String(result) : "");
    return;
  }
  if (action === "set") {
    if (!key || value === undefined) throw new Error("config set requires a key path and value");
    setConfigValue(config as unknown as Record<string, unknown>, key, value);
    await writeWorkspaceConfig(config);
    printResponse({ ok: true, data: { key, value } }, options.json, `Set ${key}`);
    return;
  }
  throw new Error(`Unknown config action: ${action}`);
}

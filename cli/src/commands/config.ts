import YAML from "yaml";
import { getConfigValue, loadWorkspaceConfig, setConfigValue, writeWorkspaceConfig } from "../core/workspace-config.js";

export async function configCommand(action: string | undefined, key?: string, value?: string): Promise<void> {
  const config = await loadWorkspaceConfig();
  if (!action || action === "show") {
    console.log(YAML.stringify(config));
    return;
  }
  if (action === "get") {
    if (!key) throw new Error("config get requires a key path");
    const result = getConfigValue(config, key);
    if (typeof result === "object") console.log(YAML.stringify(result));
    else if (result !== undefined) console.log(String(result));
    return;
  }
  if (action === "set") {
    if (!key || value === undefined) throw new Error("config set requires a key path and value");
    setConfigValue(config as unknown as Record<string, unknown>, key, value);
    await writeWorkspaceConfig(config);
    console.log(`Set ${key}`);
    return;
  }
  throw new Error(`Unknown config action: ${action}`);
}

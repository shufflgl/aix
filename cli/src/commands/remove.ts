import { removeCodexPlugin } from "../platforms/codex.js";
import { removeClaudeCodePlugin } from "../platforms/claude-code.js";
import { removeClaudeDesktopExtension } from "../platforms/claude-desktop.js";

export async function removeCommand(extensionId: string, options: { target?: string; all?: boolean }): Promise<void> {
  const targets = options.all ? ["codex", "claude-code", "claude-desktop"] : [options.target ?? "codex"];
  for (const target of targets) {
    if (target === "codex") await removeCodexPlugin(extensionId);
    else if (target === "claude-code") await removeClaudeCodePlugin(extensionId);
    else if (target === "claude-desktop") await removeClaudeDesktopExtension(extensionId);
    else throw new Error(`Unsupported remove target: ${target}`);
    console.log(`Removed ${target} extension: ${extensionId}`);
  }
}

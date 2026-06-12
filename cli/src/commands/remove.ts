import { removePlan } from "../core/plans.js";
import { printResponse, targetList } from "../core/output.js";
import { removeCodexPlugin } from "../platforms/codex.js";
import { removeClaudeCodePlugin } from "../platforms/claude-code.js";
import { removeClaudeDesktopExtension } from "../platforms/claude-desktop.js";

const ALL_REMOVE_TARGETS = ["codex", "claude-code", "claude-desktop"];

export async function removeCommand(extensionId: string, options: { target?: string; all?: boolean; json?: boolean; dryRun?: boolean }): Promise<void> {
  const targets = targetList(options.all, options.target, ALL_REMOVE_TARGETS);
  const actions = targets.flatMap((target) => removePlan(extensionId, target));
  if (options.dryRun) {
    printResponse({ ok: true, data: { extension: extensionId, targets }, actions }, options.json);
    return;
  }

  for (const target of targets) {
    if (target === "codex") await removeCodexPlugin(extensionId);
    else if (target === "claude-code") await removeClaudeCodePlugin(extensionId);
    else if (target === "claude-desktop") await removeClaudeDesktopExtension(extensionId);
    else throw new Error(`Unsupported remove target: ${target}`);
  }
  printResponse({ ok: true, data: { extension: extensionId, targets }, actions }, options.json, targets.map((target) => `Removed ${target}: ${extensionId}`).join("\n"));
}

import { loadManifest } from "../core/manifest.js";
import { installPlan } from "../core/plans.js";
import { printResponse, targetList } from "../core/output.js";
import { installCodexPlugin } from "../platforms/codex.js";
import { installClaudeCodePlugin } from "../platforms/claude-code.js";
import { installClaudeDesktopExtension } from "../platforms/claude-desktop.js";

const ALL_INSTALL_TARGETS = ["codex", "claude-code", "claude-desktop"];

export async function installCommand(extensionId: string, options: { target?: string; all?: boolean; json?: boolean; dryRun?: boolean }): Promise<void> {
  const manifest = await loadManifest(extensionId);
  const targets = targetList(options.all, options.target, ALL_INSTALL_TARGETS);
  const actions = targets.flatMap((target) => installPlan(manifest, target));
  const nextActions = [{ description: "Check required secrets", command: `aix secret check ${manifest.id} --backend env` }];
  if (options.dryRun) {
    printResponse({ ok: true, data: { extension: manifest.id, targets }, actions, nextActions }, options.json);
    return;
  }

  const outputs: Array<{ target: string; path: string }> = [];
  for (const target of targets) {
    if (target === "codex") outputs.push({ target, path: await installCodexPlugin(manifest) });
    else if (target === "claude-code") outputs.push({ target, path: await installClaudeCodePlugin(manifest) });
    else if (target === "claude-desktop") outputs.push({ target, path: await installClaudeDesktopExtension(manifest) });
    else throw new Error(`Unsupported install target: ${target}`);
  }
  printResponse({ ok: true, data: { extension: manifest.id, outputs }, actions, nextActions }, options.json, outputs.map((output) => `Installed ${output.target}: ${output.path}`).join("\n"));
}

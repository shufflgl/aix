import { loadManifest } from "../core/manifest.js";
import { buildPlan } from "../core/plans.js";
import { printResponse, targetList } from "../core/output.js";
import { buildCodexPlugin } from "../platforms/codex.js";
import { buildClaudeCodePlugin } from "../platforms/claude-code.js";
import { buildClaudeConnector, buildClaudeDesktopExtension } from "../platforms/claude-desktop.js";

const ALL_BUILD_TARGETS = ["codex", "claude-code", "claude-desktop", "claude-connector"];

export async function buildCommand(extensionId: string, options: { target?: string; all?: boolean; json?: boolean; dryRun?: boolean }): Promise<void> {
  const manifest = await loadManifest(extensionId);
  const targets = targetList(options.all, options.target, ALL_BUILD_TARGETS);
  const actions = targets.flatMap((target) => buildPlan(manifest, target));
  if (options.dryRun) {
    printResponse({ ok: true, data: { extension: manifest.id, targets }, actions }, options.json);
    return;
  }

  const outputs: Array<{ target: string; path: string }> = [];
  for (const target of targets) {
    if (target === "codex") outputs.push({ target, path: await buildCodexPlugin(manifest) });
    else if (target === "claude-code") outputs.push({ target, path: await buildClaudeCodePlugin(manifest) });
    else if (target === "claude-desktop") outputs.push({ target, path: await buildClaudeDesktopExtension(manifest) });
    else if (target === "claude-connector") outputs.push({ target, path: await buildClaudeConnector(manifest) });
    else throw new Error(`Unsupported build target: ${target}`);
  }
  printResponse({ ok: true, data: { extension: manifest.id, outputs }, actions }, options.json, outputs.map((output) => `Built ${output.target}: ${output.path}`).join("\n"));
}

import { loadManifest } from "../core/manifest.js";
import { buildCodexPlugin } from "../platforms/codex.js";
import { buildClaudeCodePlugin } from "../platforms/claude-code.js";
import { buildClaudeConnector, buildClaudeDesktopExtension } from "../platforms/claude-desktop.js";

export async function buildCommand(extensionId: string, options: { target?: string; all?: boolean }): Promise<void> {
  const manifest = await loadManifest(extensionId);
  const targets = options.all ? ["codex", "claude-code", "claude-desktop", "claude-connector"] : [options.target ?? "codex"];
  for (const target of targets) {
    if (target === "codex") console.log(`Built Codex plugin: ${await buildCodexPlugin(manifest)}`);
    else if (target === "claude-code") console.log(`Built Claude Code plugin: ${await buildClaudeCodePlugin(manifest)}`);
    else if (target === "claude-desktop") console.log(`Built Claude Desktop extension: ${await buildClaudeDesktopExtension(manifest)}`);
    else if (target === "claude-connector") console.log(`Built Claude connector template: ${await buildClaudeConnector(manifest)}`);
    else throw new Error(`Unsupported build target: ${target}`);
  }
}

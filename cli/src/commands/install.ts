import { loadManifest } from "../core/manifest.js";
import { installCodexPlugin } from "../platforms/codex.js";
import { installClaudeCodePlugin } from "../platforms/claude-code.js";
import { installClaudeDesktopExtension } from "../platforms/claude-desktop.js";

export async function installCommand(extensionId: string, options: { target?: string; all?: boolean }): Promise<void> {
  const manifest = await loadManifest(extensionId);
  const targets = options.all ? ["codex", "claude-code", "claude-desktop"] : [options.target ?? "codex"];
  for (const target of targets) {
    if (target === "codex") console.log(`Installed Codex plugin: ${await installCodexPlugin(manifest)}`);
    else if (target === "claude-code") console.log(`Installed Claude Code plugin: ${await installClaudeCodePlugin(manifest)}`);
    else if (target === "claude-desktop") console.log(`Built Claude Desktop extension bundle: ${await installClaudeDesktopExtension(manifest)}`);
    else throw new Error(`Unsupported install target: ${target}`);
  }
}

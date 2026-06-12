import fs from "fs-extra";
import path from "node:path";
import { commandExists } from "../utils/shell.js";
import { loadManifest } from "../core/manifest.js";
import { workspaceRoot } from "../core/paths.js";
import { codexDoctor } from "../platforms/codex.js";
import { claudeCodeLocalPluginPath } from "../platforms/claude-code.js";

export async function doctorCommand(extensionId = "gpt-image-2", options: { target?: string } = {}): Promise<void> {
  const target = options.target ?? "codex";
  const manifest = await loadManifest(extensionId);
  let messages: string[];
  if (target === "codex") messages = await codexDoctor(manifest);
  else if (target === "claude-code") {
    messages = [
      (await commandExists("claude")) ? "ok: claude found" : "missing: claude CLI",
      (await fs.pathExists(claudeCodeLocalPluginPath(manifest.id))) ? "ok: Claude Code local plugin installed" : "missing: Claude Code local plugin",
      (await fs.pathExists(path.join(workspaceRoot(), manifest.mcp.path))) ? "ok: MCP source found" : "missing: MCP source"
    ];
  } else if (target === "claude-desktop") {
    messages = [
      (await commandExists("npx")) ? "ok: npx found" : "missing: npx",
      (await fs.pathExists(path.join(workspaceRoot(), "dist", "claude-desktop", `${manifest.id}.mcpb`))) ? "ok: MCPB bundle built" : "missing: MCPB bundle"
    ];
  } else throw new Error(`Unsupported doctor target: ${target}`);
  for (const message of messages) console.log(message);
}

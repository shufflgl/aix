import path from "node:path";
import { ExtensionManifest } from "./manifest.js";
import { codexLocalPluginPath, personalMarketplacePath, workspaceRoot } from "./paths.js";
import { claudeCodeLocalPluginPath } from "../platforms/claude-code.js";
import { AixAction } from "./output.js";

export function buildPlan(manifest: ExtensionManifest, target: string): AixAction[] {
  const root = workspaceRoot();
  if (target === "codex") return [
    { type: "build_mcp", target, description: `Build MCP ${manifest.mcp.path}` },
    { type: "generate", target, description: "Generate Codex plugin adapter", path: path.join(root, "platforms/codex/plugins", manifest.id) }
  ];
  if (target === "claude-code") return [
    { type: "build_mcp", target, description: `Build MCP ${manifest.mcp.path}` },
    { type: "generate", target, description: "Generate Claude Code plugin adapter", path: path.join(root, "platforms/claude-code/plugins", manifest.id) }
  ];
  if (target === "claude-desktop") return [
    { type: "build_mcp", target, description: `Build MCP ${manifest.mcp.path}` },
    { type: "generate", target, description: "Generate Claude Desktop MCPB extension", path: path.join(root, "dist/claude-desktop", `${manifest.id}.mcpb`) }
  ];
  if (target === "claude-connector") return [
    { type: "generate", target, description: "Generate Claude remote connector template", path: path.join(root, "platforms/claude-desktop/connectors", manifest.id) }
  ];
  return [{ type: "unsupported", target, description: `Unsupported target ${target}` }];
}

export function installPlan(manifest: ExtensionManifest, target: string): AixAction[] {
  if (target === "codex") return [
    ...buildPlan(manifest, target),
    { type: "copy", target, description: "Copy generated plugin to Codex local plugins", path: codexLocalPluginPath(manifest.id) },
    { type: "write_json", target, description: "Update personal Codex marketplace", path: personalMarketplacePath() },
    { type: "run", target, description: "Install/refresh Codex plugin", command: `codex plugin add ${manifest.id}@personal` }
  ];
  if (target === "claude-code") return [
    ...buildPlan(manifest, target),
    { type: "copy", target, description: "Copy generated plugin to Claude Code local plugins", path: claudeCodeLocalPluginPath(manifest.id) }
  ];
  if (target === "claude-desktop") return buildPlan(manifest, target);
  return [{ type: "unsupported", target, description: `Unsupported target ${target}` }];
}

export function removePlan(extensionId: string, target: string): AixAction[] {
  if (target === "codex") return [
    { type: "run", target, description: "Remove Codex plugin registration", command: `codex plugin remove ${extensionId}@personal` },
    { type: "delete", target, description: "Delete Codex local plugin", path: codexLocalPluginPath(extensionId) },
    { type: "write_json", target, description: "Remove Codex marketplace entry", path: personalMarketplacePath() }
  ];
  if (target === "claude-code") return [
    { type: "delete", target, description: "Delete Claude Code local plugin", path: claudeCodeLocalPluginPath(extensionId) }
  ];
  if (target === "claude-desktop") return [
    { type: "delete", target, description: "Delete generated MCPB bundle", path: path.join(workspaceRoot(), "dist/claude-desktop", `${extensionId}.mcpb`) }
  ];
  return [{ type: "unsupported", target, description: `Unsupported target ${target}` }];
}

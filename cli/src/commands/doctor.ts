import fs from "fs-extra";
import path from "node:path";
import { commandExists } from "../utils/shell.js";
import { loadManifest } from "../core/manifest.js";
import { workspaceRoot } from "../core/paths.js";
import { codexDoctor } from "../platforms/codex.js";
import { claudeCodeLocalPluginPath } from "../platforms/claude-code.js";
import { AixIssue, printResponse } from "../core/output.js";
import { checkSecrets } from "../core/secrets.js";

interface CheckRow { name: string; ok: boolean; message: string; }

export async function doctorCommand(extensionId = "gpt-image-2", options: { target?: string; json?: boolean } = {}): Promise<void> {
  const target = options.target ?? "codex";
  const manifest = await loadManifest(extensionId);
  let checks: CheckRow[];
  if (target === "codex") checks = (await codexDoctor(manifest)).map(parseLegacyCheck);
  else if (target === "claude-code") {
    checks = [
      { name: "claude_cli", ok: await commandExists("claude"), message: (await commandExists("claude")) ? "claude found" : "claude CLI missing" },
      { name: "claude_code_plugin", ok: await fs.pathExists(claudeCodeLocalPluginPath(manifest.id)), message: (await fs.pathExists(claudeCodeLocalPluginPath(manifest.id))) ? "Claude Code local plugin installed" : "Claude Code local plugin missing" },
      { name: "mcp_source", ok: await fs.pathExists(path.join(workspaceRoot(), manifest.mcp.path)), message: "MCP source" }
    ];
  } else if (target === "claude-desktop") {
    checks = [
      { name: "npx", ok: await commandExists("npx"), message: (await commandExists("npx")) ? "npx found" : "npx missing" },
      { name: "mcpb_bundle", ok: await fs.pathExists(path.join(workspaceRoot(), "dist", "claude-desktop", `${manifest.id}.mcpb`)), message: "Claude Desktop MCPB bundle" }
    ];
  } else throw new Error(`Unsupported doctor target: ${target}`);

  const secretRows = await checkSecrets(manifest, "env");
  const issues: AixIssue[] = [
    ...checks.filter((check) => !check.ok).map((check) => ({ code: `missing_${check.name}`, severity: "warning" as const, message: check.message })),
    ...secretRows.filter((row) => row.status === "missing").map((row) => ({
      code: "missing_secret",
      severity: "error" as const,
      message: `${row.key} is missing for ${manifest.id}`,
      fixCommand: `aix secret init ${manifest.id} --backend env && aix secret edit ${manifest.id} --backend env`
    }))
  ];

  const ok = issues.every((issue) => issue.severity !== "error");
  const text = [...checks.map((check) => `${check.ok ? "ok" : "missing"}: ${check.message}`), ...secretRows.map((row) => `secret:${row.key}\t${row.status}`)].join("\n");
  printResponse({ ok, data: { extension: manifest.id, target, checks, secrets: secretRows }, issues }, options.json, text);
}

function parseLegacyCheck(message: string): CheckRow {
  return {
    name: message.replace(/^(ok|missing):\s*/, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    ok: message.startsWith("ok:"),
    message: message.replace(/^(ok|missing):\s*/, "")
  };
}

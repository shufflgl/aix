import fs from "fs-extra";
import path from "node:path";
import { printResponse } from "../core/output.js";
import { workspaceRoot } from "../core/paths.js";

export async function promptCommand(kind = "create-mcp", extensionId?: string, options: { json?: boolean } = {}): Promise<void> {
  const promptPath = path.join(workspaceRoot(), "prompts", `${kind}.md`);
  if (!(await fs.pathExists(promptPath))) throw new Error(`Prompt not found: ${promptPath}`);
  let prompt = await fs.readFile(promptPath, "utf8");
  if (extensionId) prompt = prompt.replaceAll("{{extId}}", extensionId);
  printResponse({ ok: true, data: { kind, extensionId, prompt } }, options.json, prompt);
}

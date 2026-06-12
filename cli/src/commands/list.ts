import { loadAllManifests } from "../core/manifest.js";
import { printResponse } from "../core/output.js";

export async function listCommand(options: { json?: boolean } = {}): Promise<void> {
  const manifests = await loadAllManifests();
  const rows = manifests.map((manifest) => ({
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    targets: {
      codex: Boolean(manifest.targets.codex?.enabled),
      claudeCode: Boolean(manifest.targets.claudeCode?.enabled),
      claudeDesktop: Boolean(manifest.targets.claudeDesktop?.enabled)
    }
  }));
  printResponse({ ok: true, data: { extensions: rows } }, options.json, [
    "ID\tVersion\tCodex\tClaude Code\tClaude Desktop",
    ...rows.map((row) => [row.id, row.version, row.targets.codex ? "yes" : "no", row.targets.claudeCode ? "yes" : "no", row.targets.claudeDesktop ? "yes" : "no"].join("\t"))
  ].join("\n"));
}

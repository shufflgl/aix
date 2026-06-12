import { loadAllManifests } from "../core/manifest.js";

export async function listCommand(): Promise<void> {
  const manifests = await loadAllManifests();
  console.log("ID\tVersion\tCodex\tClaude Code\tClaude Desktop");
  for (const manifest of manifests) {
    console.log([
      manifest.id,
      manifest.version,
      manifest.targets.codex?.enabled ? "yes" : "no",
      manifest.targets.claudeCode?.enabled ? "yes" : "no",
      manifest.targets.claudeDesktop?.enabled ? "yes" : "no"
    ].join("\t"));
  }
}

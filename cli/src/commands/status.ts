import { readState } from "../core/state.js";

export async function statusCommand(): Promise<void> {
  const state = await readState();
  if (Object.keys(state.installed).length === 0) {
    console.log("No aix-managed extensions installed.");
    return;
  }
  console.log("Extension\tTarget\tVersion\tPath\tInstalled At");
  for (const [extensionId, targets] of Object.entries(state.installed)) {
    for (const [target, entry] of Object.entries(targets)) {
      console.log([extensionId, target, entry.version, entry.installedPath, entry.installedAt].join("\t"));
    }
  }
}

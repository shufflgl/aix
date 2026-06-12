import { readState } from "../core/state.js";
import { printResponse } from "../core/output.js";

export async function statusCommand(options: { json?: boolean } = {}): Promise<void> {
  const state = await readState();
  const installed = Object.entries(state.installed).flatMap(([extensionId, targets]) =>
    Object.entries(targets).map(([target, entry]) => ({ extensionId, target, ...entry }))
  );
  const text = installed.length === 0
    ? "No aix-managed extensions installed."
    : ["Extension\tTarget\tVersion\tPath\tInstalled At", ...installed.map((entry) => [entry.extensionId, entry.target, entry.version, entry.installedPath, entry.installedAt].join("\t"))].join("\n");
  printResponse({ ok: true, data: { installed } }, options.json, text);
}

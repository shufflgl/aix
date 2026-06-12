import fs from "fs-extra";
import path from "node:path";
import { statePath } from "./paths.js";

export interface InstalledTargetState {
  version: string;
  installedPath: string;
  installedAt: string;
}

export interface AixState {
  installed: Record<string, Record<string, InstalledTargetState>>;
}

export async function readState(): Promise<AixState> {
  const file = statePath();
  if (!(await fs.pathExists(file))) return { installed: {} };
  return fs.readJson(file) as Promise<AixState>;
}

export async function writeState(state: AixState): Promise<void> {
  const file = statePath();
  await fs.ensureDir(path.dirname(file));
  await fs.writeJson(file, state, { spaces: 2 });
}

export async function setInstalled(extensionId: string, target: string, entry: InstalledTargetState): Promise<void> {
  const state = await readState();
  state.installed[extensionId] ??= {};
  state.installed[extensionId][target] = entry;
  await writeState(state);
}

export async function removeInstalled(extensionId: string, target: string): Promise<void> {
  const state = await readState();
  if (state.installed[extensionId]) {
    delete state.installed[extensionId][target];
    if (Object.keys(state.installed[extensionId]).length === 0) delete state.installed[extensionId];
  }
  await writeState(state);
}

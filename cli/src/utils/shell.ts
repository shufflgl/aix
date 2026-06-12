import { execa } from "execa";

export async function runCommand(command: string, cwd: string): Promise<void> {
  const child = execa(command, { cwd, shell: true, stdio: "inherit" });
  await child;
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    await execa("which", [command]);
    return true;
  } catch {
    return false;
  }
}

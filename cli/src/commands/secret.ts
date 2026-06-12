import { loadManifest } from "../core/manifest.js";
import { printResponse } from "../core/output.js";
import { checkSecrets, envSecretPath, initEnvSecrets, initOnePasswordRefs, onePasswordRefPath, SecretBackend, setKeychainSecret } from "../core/secrets.js";
import { runCommand } from "../utils/shell.js";

export async function secretCommand(action: string, extensionId: string, options: { backend?: SecretBackend; force?: boolean; key?: string; value?: string; json?: boolean; dryRun?: boolean }): Promise<void> {
  const manifest = await loadManifest(extensionId);
  const backend = options.backend ?? "env";

  if (action === "init") {
    const targetPath = backend === "env" ? envSecretPath(manifest.id) : backend === "1password" ? onePasswordRefPath(manifest.id) : `keychain service aix:${manifest.id}`;
    if (options.dryRun) {
      printResponse({ ok: true, data: { extension: manifest.id, backend, path: targetPath }, actions: [{ type: "init_secret", description: `Initialize ${backend} secrets`, path: targetPath }] }, options.json);
      return;
    }
    if (backend === "env") printResponse({ ok: true, data: { path: await initEnvSecrets(manifest, options.force) } }, options.json, `Wrote env secrets template: ${await initEnvSecrets(manifest, options.force)}`);
    else if (backend === "1password") printResponse({ ok: true, data: { path: await initOnePasswordRefs(manifest, options.force) } }, options.json, `Wrote 1Password reference template: ${await initOnePasswordRefs(manifest, options.force)}`);
    else if (backend === "keychain") printResponse({ ok: true, data: { service: `aix:${manifest.id}` }, nextActions: [{ description: "Store a key in macOS Keychain", command: `aix secret set ${manifest.id} --backend keychain --key <KEY> --value <VALUE>` }] }, options.json, `Keychain service: aix:${manifest.id}. Use secret set --backend keychain --key <KEY> --value <VALUE>.`);
    else assertNever(backend);
    return;
  }

  if (action === "path") {
    const value = backend === "env" ? envSecretPath(manifest.id) : backend === "1password" ? onePasswordRefPath(manifest.id) : `keychain service: aix:${manifest.id}`;
    printResponse({ ok: true, data: { extension: manifest.id, backend, path: value } }, options.json, value);
    return;
  }

  if (action === "edit") {
    if (backend !== "env" && backend !== "1password") throw new Error("secret edit supports env and 1password reference files only");
    const file = backend === "env" ? await initEnvSecrets(manifest, false) : await initOnePasswordRefs(manifest, false);
    if (options.dryRun) {
      printResponse({ ok: true, data: { file }, actions: [{ type: "edit_secret", description: `Open ${file} in editor`, path: file }] }, options.json);
      return;
    }
    const editor = process.env.EDITOR || "vi";
    await runCommand(`${editor} ${JSON.stringify(file)}`, process.cwd());
    return;
  }

  if (action === "set") {
    if (!options.key || options.value === undefined) throw new Error("secret set requires --key and --value");
    if (backend !== "keychain") throw new Error("secret set currently writes only to macOS keychain; edit env/1password files directly");
    if (options.dryRun) {
      printResponse({ ok: true, data: { extension: manifest.id, backend, key: options.key }, actions: [{ type: "set_secret", description: `Store ${options.key} in macOS Keychain service aix:${manifest.id}` }] }, options.json);
      return;
    }
    await setKeychainSecret(manifest.id, options.key, options.value);
    printResponse({ ok: true, data: { extension: manifest.id, backend, key: options.key, service: `aix:${manifest.id}` } }, options.json, `Stored ${options.key} in macOS Keychain service aix:${manifest.id}`);
    return;
  }

  if (action === "check") {
    const rows = await checkSecrets(manifest, backend);
    const missing = rows.filter((row) => row.status === "missing");
    printResponse({
      ok: missing.length === 0,
      data: { extension: manifest.id, backend, secrets: rows },
      issues: missing.map((row) => ({ code: "missing_secret", severity: "error" as const, message: `${row.key} is missing`, fixCommand: `aix secret init ${manifest.id} --backend ${backend}` }))
    }, options.json, rows.map((row) => `${row.key}\t${row.status}`).join("\n"));
    return;
  }

  throw new Error(`Unknown secret action: ${action}`);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported backend: ${value}`);
}

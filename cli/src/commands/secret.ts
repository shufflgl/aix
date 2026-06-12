import { loadManifest } from "../core/manifest.js";
import { checkSecrets, envSecretPath, initEnvSecrets, initOnePasswordRefs, onePasswordRefPath, SecretBackend, setKeychainSecret } from "../core/secrets.js";
import { runCommand } from "../utils/shell.js";

export async function secretCommand(action: string, extensionId: string, options: { backend?: SecretBackend; force?: boolean; key?: string; value?: string }): Promise<void> {
  const manifest = await loadManifest(extensionId);
  const backend = options.backend ?? "env";

  if (action === "init") {
    if (backend === "env") console.log(`Wrote env secrets template: ${await initEnvSecrets(manifest, options.force)}`);
    else if (backend === "1password") console.log(`Wrote 1Password reference template: ${await initOnePasswordRefs(manifest, options.force)}`);
    else if (backend === "keychain") console.log(`Keychain service: aix:${manifest.id}. Use secret set --backend keychain --key <KEY> --value <VALUE>.`);
    else assertNever(backend);
    return;
  }

  if (action === "path") {
    if (backend === "env") console.log(envSecretPath(manifest.id));
    else if (backend === "1password") console.log(onePasswordRefPath(manifest.id));
    else if (backend === "keychain") console.log(`keychain service: aix:${manifest.id}`);
    else assertNever(backend);
    return;
  }

  if (action === "edit") {
    if (backend !== "env" && backend !== "1password") throw new Error("secret edit supports env and 1password reference files only");
    const file = backend === "env" ? await initEnvSecrets(manifest, false) : await initOnePasswordRefs(manifest, false);
    const editor = process.env.EDITOR || "vi";
    await runCommand(`${editor} ${JSON.stringify(file)}`, process.cwd());
    return;
  }

  if (action === "set") {
    if (!options.key || options.value === undefined) throw new Error("secret set requires --key and --value");
    if (backend !== "keychain") throw new Error("secret set currently writes only to macOS keychain; edit env/1password files directly");
    await setKeychainSecret(manifest.id, options.key, options.value);
    console.log(`Stored ${options.key} in macOS Keychain service aix:${manifest.id}`);
    return;
  }

  if (action === "check") {
    const rows = await checkSecrets(manifest, backend);
    for (const row of rows) console.log(`${row.key}\t${row.status}`);
    return;
  }

  throw new Error(`Unknown secret action: ${action}`);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported backend: ${value}`);
}

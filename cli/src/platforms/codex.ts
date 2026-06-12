import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { ExtensionManifest } from "../core/manifest.js";
import { copyAndBuildMcp, copySkills, defaultNonSecretEnv, envExample, launcherScript, timestamp } from "../core/build.js";
import { codexLocalPluginPath, personalMarketplacePath, workspaceRoot } from "../core/paths.js";
import { setInstalled, removeInstalled } from "../core/state.js";
import { commandExists, runCommand } from "../utils/shell.js";

export async function buildCodexPlugin(manifest: ExtensionManifest): Promise<string> {
  const root = workspaceRoot();
  const platformPlugin = path.join(root, "platforms", "codex", "plugins", manifest.id);
  const serverDir = path.join(platformPlugin, "server");

  await fs.remove(platformPlugin);
  await copyAndBuildMcp(manifest, serverDir);
  await fs.ensureDir(path.join(platformPlugin, ".codex-plugin"));
  await fs.ensureDir(path.join(platformPlugin, "scripts"));
  await copySkills(manifest, path.join(platformPlugin, "skills"));

  await fs.writeJson(path.join(platformPlugin, ".codex-plugin", "plugin.json"), codexPluginJson(manifest), { spaces: 2 });
  await fs.writeJson(path.join(platformPlugin, ".mcp.json"), codexMcpJson(manifest), { spaces: 2 });
  await fs.writeFile(path.join(platformPlugin, ".env.example"), envExample(manifest));
  await fs.writeFile(path.join(platformPlugin, "scripts", `start-${manifest.id}.mjs`), launcherScript());
  await fs.chmod(path.join(platformPlugin, "scripts", `start-${manifest.id}.mjs`), 0o755);
  await fs.writeFile(path.join(platformPlugin, "README.md"), readme(manifest));
  return platformPlugin;
}

export async function installCodexPlugin(manifest: ExtensionManifest): Promise<string> {
  const builtPath = await buildCodexPlugin(manifest);
  const installPath = codexLocalPluginPath(manifest.id);
  await fs.remove(installPath);
  await fs.ensureDir(path.dirname(installPath));
  await fs.copy(builtPath, installPath);
  await updatePersonalMarketplace(manifest, installPath);

  if (await commandExists("codex")) {
    await runCommand(`codex plugin add ${manifest.id}@personal`, workspaceRoot());
  }

  await setInstalled(manifest.id, "codex", {
    version: manifest.version,
    installedPath: installPath,
    installedAt: new Date().toISOString()
  });

  return installPath;
}

export async function removeCodexPlugin(extensionId: string): Promise<void> {
  if (await commandExists("codex")) {
    await runCommand(`codex plugin remove ${extensionId}@personal || true`, workspaceRoot());
  }
  await removeMarketplaceEntry(extensionId);
  await fs.remove(codexLocalPluginPath(extensionId));
  await removeInstalled(extensionId, "codex");
}

export async function codexDoctor(manifest: ExtensionManifest): Promise<string[]> {
  const messages: string[] = [];
  messages.push((await commandExists("node")) ? "ok: node found" : "missing: node");
  messages.push((await commandExists("npm")) ? "ok: npm found" : "missing: npm");
  messages.push((await commandExists("codex")) ? "ok: codex found" : "missing: codex CLI");
  messages.push((await fs.pathExists(path.join(workspaceRoot(), manifest.mcp.path))) ? "ok: MCP source found" : "missing: MCP source");
  messages.push((await fs.pathExists(codexLocalPluginPath(manifest.id))) ? "ok: Codex local plugin installed" : "missing: Codex local plugin");
  messages.push((await fs.pathExists(personalMarketplacePath())) ? "ok: personal marketplace found" : "missing: personal marketplace");
  return messages;
}

async function updatePersonalMarketplace(manifest: ExtensionManifest, installPath: string): Promise<void> {
  const marketplacePath = personalMarketplacePath();
  await fs.ensureDir(path.dirname(marketplacePath));
  const marketplace = (await fs.pathExists(marketplacePath))
    ? await fs.readJson(marketplacePath)
    : { name: "personal", interface: { displayName: "Personal" }, plugins: [] };

  marketplace.name ??= "personal";
  marketplace.interface ??= { displayName: "Personal" };
  marketplace.plugins = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
  marketplace.plugins = marketplace.plugins.filter((plugin: { name?: string }) => plugin.name !== manifest.id);
  marketplace.plugins.push({
    name: manifest.id,
    source: {
      source: "local",
      path: toHomeRelativePath(installPath)
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL"
    },
    category: manifest.category
  });

  await fs.writeJson(marketplacePath, marketplace, { spaces: 2 });
}

async function removeMarketplaceEntry(extensionId: string): Promise<void> {
  const marketplacePath = personalMarketplacePath();
  if (!(await fs.pathExists(marketplacePath))) return;
  const marketplace = await fs.readJson(marketplacePath);
  if (Array.isArray(marketplace.plugins)) {
    marketplace.plugins = marketplace.plugins.filter((plugin: { name?: string }) => plugin.name !== extensionId);
  }
  await fs.writeJson(marketplacePath, marketplace, { spaces: 2 });
}

function toHomeRelativePath(absolutePath: string): string {
  const home = os.homedir();
  const relative = path.relative(home, absolutePath);
  return relative.startsWith("..") ? absolutePath : `./${relative}`;
}

function codexPluginJson(manifest: ExtensionManifest) {
  return {
    name: manifest.id,
    version: `${manifest.version}+codex.${timestamp()}`,
    description: manifest.description,
    author: { name: "Local developer" },
    homepage: manifest.homepage,
    repository: manifest.repository,
    license: manifest.license,
    keywords: ["mcp", "skill", manifest.id],
    skills: "./skills/",
    mcpServers: "./.mcp.json",
    interface: {
      displayName: manifest.name,
      shortDescription: manifest.description,
      longDescription: `${manifest.name} is managed by aix and wraps a shared MCP server for Codex.`,
      developerName: "Local developer",
      category: manifest.category,
      capabilities: ["MCP", "Skill"],
      websiteURL: manifest.homepage,
      defaultPrompt: [`Use ${manifest.name}.`],
      brandColor: "#7C3AED"
    }
  };
}

function codexMcpJson(manifest: ExtensionManifest) {
  return {
    mcpServers: {
      [manifest.mcp.id]: {
        command: "node",
        args: [`./scripts/start-${manifest.id}.mjs`],
        cwd: ".",
        env: defaultNonSecretEnv(manifest)
      }
    }
  };
}

function readme(manifest: ExtensionManifest): string {
  return `# ${manifest.name}\n\nManaged by aix.\n\n## MCP Tools\n\n${manifest.mcp.tools.map((tool) => `- \`${tool}\``).join("\n")}\n\n## Configuration\n\nCopy \`.env.example\` to \`.env\` and fill required values.\n`;
}

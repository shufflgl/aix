import fs from "fs-extra";
import { printResponse } from "../core/output.js";
import { defaultWorkspaceConfig, loadWorkspaceConfig, workspaceConfigPath, writeWorkspaceConfig } from "../core/workspace-config.js";

export async function initCommand(options: Record<string, string | boolean | undefined>): Promise<void> {
  const file = workspaceConfigPath();
  if ((await fs.pathExists(file)) && !options.force) {
    printResponse({
      ok: true,
      data: { path: file, existed: true },
      nextActions: [{ description: "Overwrite existing workspace config", command: "aix init --force" }]
    }, Boolean(options.json), `Workspace config already exists: ${file}\nUse --force to overwrite it.`);
    return;
  }

  const config = defaultWorkspaceConfig();
  config.project.name = stringOption(options.projectName, config.project.name);
  config.project.description = stringOption(options.projectDescription, config.project.description);
  config.project.homepage = stringOption(options.homepage, config.project.homepage);
  config.project.repository = stringOption(options.repository, config.project.repository);
  config.project.license = stringOption(options.license, config.project.license);
  config.publisher.name = stringOption(options.publisherName, config.publisher.name);
  config.publisher.displayName = stringOption(options.publisherDisplayName, config.publisher.displayName ?? config.publisher.name);
  config.publisher.email = stringOption(options.publisherEmail, config.publisher.email);
  config.publisher.url = stringOption(options.publisherUrl, config.publisher.url);
  config.defaults.category = stringOption(options.category, config.defaults.category);
  config.defaults.brandColor = stringOption(options.brandColor, config.defaults.brandColor);
  config.platforms.codex.developerName = config.publisher.displayName ?? config.publisher.name;
  config.platforms.claudeCode.author = config.publisher.name;
  config.platforms.claudeDesktop.author = {
    name: config.publisher.name,
    email: config.publisher.email,
    url: config.publisher.url
  };

  await writeWorkspaceConfig(config);
  const loaded = await loadWorkspaceConfig();
  printResponse({ ok: true, data: { path: file, config: loaded } }, Boolean(options.json), options.yes ? `Wrote workspace config: ${file}` : `Wrote workspace config: ${file}\n${JSON.stringify(loaded, null, 2)}`);
}

function stringOption(value: unknown, fallback?: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback ?? "";
}

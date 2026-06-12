import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { workspaceRoot } from "./paths.js";

const WorkspaceConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    homepage: z.string().optional(),
    repository: z.string().optional(),
    license: z.string().optional().default("MIT")
  }),
  publisher: z.object({
    name: z.string().min(1),
    displayName: z.string().optional(),
    email: z.string().optional(),
    url: z.string().optional()
  }),
  defaults: z.object({
    category: z.string().optional().default("Productivity"),
    brandColor: z.string().optional().default("#7C3AED")
  }).optional().default({}),
  platforms: z.object({
    codex: z.object({
      marketplace: z.string().optional().default("personal"),
      developerName: z.string().optional()
    }).optional().default({}),
    claudeCode: z.object({
      author: z.string().optional()
    }).optional().default({}),
    claudeDesktop: z.object({
      author: z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        url: z.string().optional()
      }).optional().default({})
    }).optional().default({})
  }).optional().default({})
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;

export function workspaceConfigPath(): string {
  return path.join(workspaceRoot(), "aix.yaml");
}

export function defaultWorkspaceConfig(): WorkspaceConfig {
  return WorkspaceConfigSchema.parse({
    project: {
      name: path.basename(workspaceRoot()),
      description: "AI Extensions Manager workspace",
      license: "MIT"
    },
    publisher: {
      name: "Local developer",
      displayName: "Local developer"
    },
    defaults: {
      category: "Productivity",
      brandColor: "#7C3AED"
    },
    platforms: {
      codex: { marketplace: "personal" },
      claudeCode: {},
      claudeDesktop: { author: {} }
    }
  });
}

export async function loadWorkspaceConfig(): Promise<WorkspaceConfig> {
  const file = workspaceConfigPath();
  if (!(await fs.pathExists(file))) return defaultWorkspaceConfig();
  const raw = await fs.readFile(file, "utf8");
  return WorkspaceConfigSchema.parse(YAML.parse(raw));
}

export async function writeWorkspaceConfig(config: WorkspaceConfig): Promise<void> {
  const parsed = WorkspaceConfigSchema.parse(config);
  await fs.writeFile(workspaceConfigPath(), YAML.stringify(parsed));
}

export function getConfigValue(config: unknown, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) return (current as Record<string, unknown>)[key];
    return undefined;
  }, config);
}

export function setConfigValue(config: Record<string, unknown>, keyPath: string, value: string): void {
  const parts = keyPath.split(".");
  let current: Record<string, unknown> = config;
  for (const part of parts.slice(0, -1)) {
    if (!current[part] || typeof current[part] !== "object") current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

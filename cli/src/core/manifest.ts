import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
import { workspaceRoot } from "./paths.js";

const EnvVarSchema = z.object({
  required: z.boolean().optional().default(false),
  secret: z.boolean().optional().default(false),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  description: z.string().optional()
});

const ManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional().default("Productivity"),
  homepage: z.string().optional(),
  repository: z.string().optional(),
  license: z.string().optional(),
  mcp: z.object({
    id: z.string().min(1),
    path: z.string().min(1),
    type: z.literal("stdio"),
    runtime: z.string().optional(),
    command: z.string().min(1),
    args: z.array(z.string()).optional().default([]),
    build: z.array(z.string()).optional().default([]),
    tools: z.array(z.string()).optional().default([])
  }),
  skills: z.array(z.string()).optional().default([]),
  env: z.record(EnvVarSchema).optional().default({}),
  targets: z.record(z.any()).optional().default({})
});

export type ExtensionManifest = z.infer<typeof ManifestSchema>;

export async function loadManifest(extensionId: string): Promise<ExtensionManifest> {
  const manifestPath = path.join(workspaceRoot(), "manifests", `${extensionId}.yaml`);
  if (!(await fs.pathExists(manifestPath))) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const raw = await fs.readFile(manifestPath, "utf8");
  return ManifestSchema.parse(YAML.parse(raw));
}

export async function loadAllManifests(): Promise<ExtensionManifest[]> {
  const manifestDir = path.join(workspaceRoot(), "manifests");
  const files = (await fs.readdir(manifestDir)).filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"));
  const manifests: ExtensionManifest[] = [];
  for (const file of files.sort()) {
    const raw = await fs.readFile(path.join(manifestDir, file), "utf8");
    manifests.push(ManifestSchema.parse(YAML.parse(raw)));
  }
  return manifests;
}

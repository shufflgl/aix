#!/usr/bin/env node
import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { buildCommand } from "./commands/build.js";
import { installCommand } from "./commands/install.js";
import { statusCommand } from "./commands/status.js";
import { doctorCommand } from "./commands/doctor.js";
import { removeCommand } from "./commands/remove.js";
import { initCommand } from "./commands/init.js";
import { configCommand } from "./commands/config.js";

const program = new Command();

program
  .name("aix")
  .description("AI Extensions Manager")
  .version("0.1.0");


program.command("init")
  .description("Initialize or rewrite aix workspace metadata")
  .option("--yes", "print less output")
  .option("--force", "overwrite existing aix.yaml")
  .option("--project-name <name>")
  .option("--project-description <description>")
  .option("--homepage <url>")
  .option("--repository <url>")
  .option("--license <license>")
  .option("--publisher-name <name>")
  .option("--publisher-display-name <name>")
  .option("--publisher-email <email>")
  .option("--publisher-url <url>")
  .option("--category <category>")
  .option("--brand-color <hex>")
  .action((options) => wrap(() => initCommand(options))());

program.command("config")
  .argument("[action]", "show|get|set", "show")
  .argument("[key]")
  .argument("[value]")
  .description("Show or edit aix workspace metadata")
  .action((action, key, value) => wrap(() => configCommand(action, key, value))());

program.command("list")
  .description("List available extensions")
  .action(wrap(listCommand));

program.command("build")
  .argument("<extension>")
  .option("--target <target>", "target platform", "codex")
  .option("--all", "build all supported targets")
  .description("Build platform adapters")
  .action((extension, options) => wrap(() => buildCommand(extension, options))());

program.command("install")
  .argument("<extension>")
  .option("--target <target>", "target platform", "codex")
  .option("--all", "install all supported targets")
  .description("Install an extension")
  .action((extension, options) => wrap(() => installCommand(extension, options))());

program.command("status")
  .description("Show installed aix-managed extensions")
  .action(wrap(statusCommand));

program.command("doctor")
  .argument("[extension]", "extension id", "gpt-image-2")
  .option("--target <target>", "target platform", "codex")
  .description("Diagnose an extension")
  .action((extension, options) => wrap(() => doctorCommand(extension, options))());

program.command("remove")
  .argument("<extension>")
  .option("--target <target>", "target platform", "codex")
  .option("--all", "remove all supported targets")
  .description("Remove an installed extension")
  .action((extension, options) => wrap(() => removeCommand(extension, options))());

await program.parseAsync();

function wrap(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    try {
      await fn();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  };
}

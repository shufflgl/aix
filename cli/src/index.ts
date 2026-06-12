#!/usr/bin/env node
import { Command } from "commander";
import { buildCommand } from "./commands/build.js";
import { configCommand } from "./commands/config.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { installCommand } from "./commands/install.js";
import { listCommand } from "./commands/list.js";
import { removeCommand } from "./commands/remove.js";
import { secretCommand } from "./commands/secret.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program
  .name("aix")
  .description("Agent-oriented AI Extensions Manager")
  .version("0.1.0");

addInitCommand(program);
addConfigCommand(program);
addListCommand(program);
addBuildCommand(program);
addInstallCommand(program);
addSecretCommand(program);
addStatusCommand(program);
addDoctorCommand(program);
addRemoveCommand(program);
addExtNamespace(program);

await program.parseAsync();

function addInitCommand(parent: Command): void {
  parent.command("init")
    .description("Initialize or rewrite aix workspace metadata")
    .option("--json", "emit machine-readable JSON")
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
}

function addConfigCommand(parent: Command): void {
  parent.command("config")
    .argument("[action]", "show|get|set", "show")
    .argument("[key]")
    .argument("[value]")
    .option("--json", "emit machine-readable JSON")
    .description("Show or edit aix workspace metadata")
    .action((action, key, value, options) => wrap(() => configCommand(action, key, value, options))());
}

function addListCommand(parent: Command): void {
  parent.command("list")
    .alias("ls")
    .option("--json", "emit machine-readable JSON")
    .description("List available extensions")
    .action((options) => wrap(() => listCommand(options))());
}

function addBuildCommand(parent: Command): void {
  parent.command("build")
    .argument("<extension>")
    .option("--target <target>", "target platform", "codex")
    .option("--all", "build all supported targets")
    .option("--dry-run", "show actions without changing files")
    .option("--json", "emit machine-readable JSON")
    .description("Build platform adapters")
    .action((extension, options) => wrap(() => buildCommand(extension, options))());
}

function addInstallCommand(parent: Command): void {
  parent.command("install")
    .argument("<extension>")
    .option("--target <target>", "target platform", "codex")
    .option("--all", "install all supported targets")
    .option("--dry-run", "show actions without changing files")
    .option("--json", "emit machine-readable JSON")
    .description("Install an extension")
    .action((extension, options) => wrap(() => installCommand(extension, options))());
}

function addSecretCommand(parent: Command): void {
  parent.command("secret")
    .argument("<action>", "init|path|edit|set|check")
    .argument("<extension>")
    .option("--backend <backend>", "env|keychain|1password", "env")
    .option("--force", "overwrite existing secret template")
    .option("--key <key>")
    .option("--value <value>")
    .option("--dry-run", "show actions without changing files")
    .option("--json", "emit machine-readable JSON")
    .description("Manage local extension secrets")
    .action((action, extension, options) => wrap(() => secretCommand(action, extension, options))());
}

function addStatusCommand(parent: Command): void {
  parent.command("status")
    .option("--json", "emit machine-readable JSON")
    .description("Show installed aix-managed extensions")
    .action((options) => wrap(() => statusCommand(options))());
}

function addDoctorCommand(parent: Command): void {
  parent.command("doctor")
    .argument("[extension]", "extension id", "gpt-image-2")
    .option("--target <target>", "target platform", "codex")
    .option("--json", "emit machine-readable JSON")
    .description("Diagnose an extension")
    .action((extension, options) => wrap(() => doctorCommand(extension, options))());
}

function addRemoveCommand(parent: Command): void {
  parent.command("remove")
    .argument("<extension>")
    .option("--target <target>", "target platform", "codex")
    .option("--all", "remove all supported targets")
    .option("--dry-run", "show actions without changing files")
    .option("--json", "emit machine-readable JSON")
    .description("Remove an installed extension")
    .action((extension, options) => wrap(() => removeCommand(extension, options))());
}

function addExtNamespace(parent: Command): void {
  const ext = parent.command("ext").description("Manage ext lifecycle with agent-friendly commands");
  addListCommand(ext);
  addBuildCommand(ext);
  addInstallCommand(ext);
  addStatusCommand(ext);
  addDoctorCommand(ext);
  addRemoveCommand(ext);
}

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

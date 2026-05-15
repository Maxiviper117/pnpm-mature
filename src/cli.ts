#!/usr/bin/env node

import { Command, InvalidArgumentError, Option } from "commander";

import { runInstallCommand } from "./commands/install";
import { runUpdateCommand } from "./commands/update";
import { normalizeDependencyNames } from "./package-name/normalize";
import type { CommandOptions } from "./types";

const program = new Command();

program
  .name("pnpm-mature")
  .description("Age-constrained dependency updates and installs powered by pnpm.")
  .version("0.1.0");

for (const definition of [
  {
    name: "update",
    description: "Update dependencies by writing maturity-aware versions into package.json.",
    runner: runUpdateCommand,
  },
  {
    name: "install",
    description: "Install dependencies after writing maturity-aware versions into package.json.",
    runner: runInstallCommand,
  },
] as const) {
  program
    .command(definition.name)
    .description(definition.description)
    .argument(
      "[packages...]",
      "Only process the specified direct dependencies instead of the full manifest.",
    )
    .option(
      "-a, --age <days>",
      "Only allow versions published more than this many days ago.",
      parsePositiveInt,
    )
    .option(
      "-g, --use-pnpm-global-config",
      "Read minimumReleaseAge from pnpm global config when --age is omitted.",
      false,
    )
    .addOption(
      new Option(
        "-p, --ignore-pinned [level]",
        "Widen exact pinned versions so mature updates can move within the same major or across majors. Defaults to all when passed without a value.",
      )
        .preset("all")
        .argParser(parseIgnorePinnedLevel),
    )
    .option("-d, --dry-run", "Print selected versions and package.json updates without running pnpm.")
    .option(
      "-t, --include-transitive",
      "Reserved for a future release. Currently unsupported.",
      false,
    )
    .action(async (packages: string[], commandFlags) => {
      const options: CommandOptions = {
        age: commandFlags.age,
        dependencyNames: normalizeDependencyNames(packages),
        dryRun: Boolean(commandFlags.dryRun),
        ignorePinned: commandFlags.ignorePinned,
        includeTransitive: Boolean(commandFlags.includeTransitive),
        projectDir: process.cwd(),
        usePnpmGlobalConfig: Boolean(commandFlags.usePnpmGlobalConfig),
      };

      try {
        const exitCode = await definition.runner(options);
        process.exitCode = exitCode;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`pnpm-mature: ${message}`);
        process.exitCode = 1;
      }
    });
}

await program.parseAsync(process.argv);

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError("must be a positive integer");
  }

  return parsed;
}

function parseIgnorePinnedLevel(value: string): "all" | "major" | "minor" {
  if (value === "all" || value === "major" || value === "minor") {
    return value;
  }

  throw new InvalidArgumentError("must be one of all, major, or minor");
}

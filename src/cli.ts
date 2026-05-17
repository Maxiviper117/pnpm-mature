#!/usr/bin/env node

import { Command, InvalidArgumentError, Option } from "commander";

import { runInstallCommand } from "./commands/install";
import { runUpdateCommand } from "./commands/update";
import { normalizeDependencyNames } from "./package-name/normalize";
import type { CommandOptions } from "./types";
import { checkForNewVersion } from "./utils/version-notice";
import pkg from "../package.json";

const program = new Command();

program
  .name("pnpm-mature")
  .description("Age-constrained dependency updates and installs powered by pnpm.")
  .version(pkg.version);

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
        "-r, --relax [level]",
        "Relax declared version constraints so mature updates can move within the same major or across majors. Applies to both exact pinned versions and semver ranges. Defaults to all when passed without a value.",
      )
        .preset("all")
        .argParser(parseRelaxLevel),
    )
    .option(
      "-d, --dry-run",
      "Print selected versions and package.json updates without running pnpm.",
    )
    .option("-y, --yes", "Skip the update confirmation prompt.", false)
    .option(
      "-t, --include-transitive",
      "Reserved for a future release. Currently unsupported.",
      false,
    )
    .option(
      "--registry-max-response-mib <mib>",
      "Override the maximum npm registry response size in MiB.",
      parsePositiveInt,
    )
    .option("--max-registry-mib <mib>", "Alias for --registry-max-response-mib.", parsePositiveInt)
    .action(async (packages: string[], commandFlags) => {
      const notice = await checkForNewVersion(pkg.version);

      if (notice) {
        console.error(notice);
      }

      const registryMaxResponseMiB =
        commandFlags.registryMaxResponseMib ?? commandFlags.maxRegistryMib;

      const options: CommandOptions = {
        age: commandFlags.age,
        assumeYes: Boolean(commandFlags.yes),
        dependencyNames: normalizeDependencyNames(packages),
        dryRun: Boolean(commandFlags.dryRun),
        relax: commandFlags.relax,
        includeTransitive: Boolean(commandFlags.includeTransitive),
        projectDir: process.cwd(),
        registryMaxResponseMiB,
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

function parseRelaxLevel(value: string): "all" | "major" | "minor" {
  if (value === "all" || value === "major" || value === "minor") {
    return value;
  }

  throw new InvalidArgumentError("must be one of all, major, or minor");
}

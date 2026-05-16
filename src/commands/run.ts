import path from "node:path";

import pc from "picocolors";

import { selectMatureVersion } from "../maturity/filter";
import { collectDirectDependencies } from "../package-json/read";
import { formatMinimumAgeShortLabel, resolveMinimumAgeMinutes } from "../pnpm/config";
import { applyPackageManifestUpdates, recoverPackageJsonIfNeeded } from "../pnpm/overrides";
import { runPnpmCommand } from "../pnpm/runner";
import { fetchRegistryPackageMeta } from "../registry/npm";
import type { CommandOptions, DependencySelection } from "../types";
import { mapWithConcurrency } from "../utils/concurrency";
import { readPackageManifest } from "../package-json/read";

export async function runMatureCommand(
  command: "update" | "install",
  options: CommandOptions,
): Promise<number> {
  const minimumAgeMinutes = await resolveMinimumAgeMinutes(options);
  validateOptions(options, minimumAgeMinutes);

  await recoverPackageJsonIfNeeded(options.projectDir);

  const manifestState = await readPackageManifest(options.projectDir);
  const { supported, unsupported } = collectDirectDependencies(manifestState.manifest);
  const requestedDependencies = resolveRequestedDependencies(
    supported,
    unsupported,
    options.dependencyNames,
  );

  if (requestedDependencies.length === 0) {
    console.log(pc.yellow("No supported direct dependencies found in package.json."));
    reportUnsupported(unsupported);
    return 0;
  }

  console.log(
    pc.cyan(
      `Inspecting ${requestedDependencies.length} direct dependencies in ${path.basename(options.projectDir)}...`,
    ),
  );

  const registryResults = await mapWithConcurrency(requestedDependencies, 8, async (dependency) => {
    const registryMeta = await fetchRegistryPackageMeta(dependency.name, {
      maxResponseMiB: options.registryMaxResponseMiB,
    });
    return selectMatureVersion(dependency, registryMeta, minimumAgeMinutes, options.ignorePinned);
  });

  reportSelections(registryResults, minimumAgeMinutes, unsupported);

  const failures = registryResults.filter((result) => !result.selected);

  if (failures.length > 0) {
    console.error(
      pc.red(`Unable to generate safe maturity constraints for ${failures.length} dependencies.`),
    );
    return 1;
  }

  const manifestUpdates = registryResults.map((result) => ({
    field: result.dependency.field,
    name: result.dependency.name,
    version: result.selected!.version,
  }));

  const selectedVersions = Object.fromEntries(
    manifestUpdates.map((update) => [update.name, update.version]),
  );

  if (options.dryRun) {
    console.log(pc.bold("\nGenerated package.json updates:"));
    for (const [name, version] of Object.entries(selectedVersions)) {
      console.log(`  ${name}: ${version}`);
    }

    return 0;
  }

  const manifestMutation = await applyPackageManifestUpdates(options.projectDir, manifestUpdates);
  const cleanupHandlers = installCleanupHandlers(manifestMutation.rollback);
  let succeeded = false;

  try {
    console.log(
      pc.bold(`\nWriting selected versions to package.json and running pnpm ${command}...`),
    );
    const exitCode = await runPnpmCommand(
      options.projectDir,
      command,
      options.dependencyNames ?? [],
    );
    succeeded = exitCode === 0;
    return exitCode;
  } finally {
    cleanupHandlers.dispose();

    if (succeeded) {
      await manifestMutation.commit();
    } else {
      await cleanupHandlers.cleanup();
    }
  }
}

function resolveRequestedDependencies(
  supported: CommandDependency[],
  unsupported: Array<{ name: string; spec: string; reason: string }>,
  dependencyNames: string[] | undefined,
): CommandDependency[] {
  if (!dependencyNames || dependencyNames.length === 0) {
    return supported;
  }

  const supportedByName = new Map(supported.map((dependency) => [dependency.name, dependency]));
  const unsupportedByName = new Map(unsupported.map((dependency) => [dependency.name, dependency]));
  const requested: CommandDependency[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const name of dependencyNames) {
    const supportedDependency = supportedByName.get(name);

    if (supportedDependency) {
      requested.push(supportedDependency);
      continue;
    }

    const unsupportedDependency = unsupportedByName.get(name);

    if (unsupportedDependency) {
      invalid.push(
        `${unsupportedDependency.name}@${unsupportedDependency.spec} (${unsupportedDependency.reason})`,
      );
      continue;
    }

    missing.push(name);
  }

  if (invalid.length > 0 || missing.length > 0) {
    const details = [
      invalid.length > 0 ? `unsupported: ${invalid.join(", ")}` : undefined,
      missing.length > 0 ? `not found: ${missing.join(", ")}` : undefined,
    ]
      .filter((value) => value)
      .join("; ");

    throw new Error(`Unable to target the requested dependencies: ${details}`);
  }

  return requested;
}

type CommandDependency = DependencySelection["dependency"];

function validateOptions(options: CommandOptions, minimumAgeMinutes: number): void {
  if (!Number.isInteger(minimumAgeMinutes) || minimumAgeMinutes <= 0) {
    throw new Error("Minimum release age must resolve to a positive integer number of minutes");
  }

  if (options.includeTransitive) {
    throw new Error(
      "--include-transitive is reserved for a later release and is not supported in 0.1.0",
    );
  }

  if (
    options.registryMaxResponseMiB !== undefined &&
    (!Number.isInteger(options.registryMaxResponseMiB) || options.registryMaxResponseMiB <= 0)
  ) {
    throw new Error("--registry-max-response-mib must be a positive integer");
  }
}

function reportSelections(
  selections: DependencySelection[],
  minimumAgeMinutes: number,
  unsupported: Array<{ name: string; spec: string; reason: string }>,
): void {
  for (const selection of selections) {
    const { dependency, latest, selected, skippedRecent, reason } = selection;

    console.log(`\n${pc.bold(dependency.name)}`);
    console.log(`  declared: ${dependency.spec}`);
    console.log(`  latest: ${formatVersionLine(latest)}`);
    console.log(`  selected: ${formatVersionLine(selected)}`);

    if (skippedRecent.length > 0) {
      console.log(
        `  skipped recent (< ${formatMinimumAgeShortLabel(minimumAgeMinutes)}): ${skippedRecent.map((version) => version.version).join(", ")}`,
      );
    }

    if (reason) {
      console.log(`  reason: ${pc.red(reason)}`);
    }
  }

  reportUnsupported(unsupported);
}

function reportUnsupported(
  unsupported: Array<{ name: string; spec: string; reason: string }>,
): void {
  if (unsupported.length === 0) {
    return;
  }

  console.log(pc.yellow(`\nSkipped ${unsupported.length} unsupported dependencies:`));

  for (const entry of unsupported) {
    console.log(`  ${entry.name}@${entry.spec} - ${entry.reason}`);
  }
}

function formatVersionLine(version: { version: string; publishedAt: Date } | undefined): string {
  if (!version) {
    return pc.dim("none");
  }

  return `${version.version} (${version.publishedAt.toISOString().slice(0, 10)})`;
}

function installCleanupHandlers(restore: () => Promise<void>): {
  cleanup: () => Promise<void>;
  dispose: () => void;
} {
  let restorePromise: Promise<void> | undefined;
  let disposed = false;

  const cleanup = async () => {
    if (!restorePromise) {
      restorePromise = restore();
    }

    await restorePromise;
  };

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    process.removeListener("SIGINT", handleSignal);
    process.removeListener("SIGTERM", handleSignal);
  };

  const handleSignal = (signal: NodeJS.Signals) => {
    dispose();
    void cleanup()
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(pc.red(`Failed to restore package.json after ${signal}: ${message}`));
        process.exitCode = 1;
      })
      .finally(() => {
        process.kill(process.pid, signal);
      });
  };

  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);

  return {
    cleanup,
    dispose,
  };
}

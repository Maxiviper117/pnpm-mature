import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

type SelectMatureVersion = (typeof import("../../src/maturity/filter"))["selectMatureVersion"];
type CollectDirectDependencies =
  (typeof import("../../src/package-json/read"))["collectDirectDependencies"];
type ReadPackageManifest = (typeof import("../../src/package-json/read"))["readPackageManifest"];
type FormatMinimumAgeShortLabel =
  (typeof import("../../src/pnpm/config"))["formatMinimumAgeShortLabel"];
type ResolveMinimumAgeMinutes =
  (typeof import("../../src/pnpm/config"))["resolveMinimumAgeMinutes"];
type ApplyPackageManifestUpdates =
  (typeof import("../../src/pnpm/overrides"))["applyPackageManifestUpdates"];
type RecoverPackageJsonIfNeeded =
  (typeof import("../../src/pnpm/overrides"))["recoverPackageJsonIfNeeded"];
type RunPnpmCommand = (typeof import("../../src/pnpm/runner"))["runPnpmCommand"];
type FetchRegistryPackageMeta =
  (typeof import("../../src/registry/npm"))["fetchRegistryPackageMeta"];

vi.mock("../../src/maturity/filter", () => ({
  selectMatureVersion: vi.fn<SelectMatureVersion>(),
}));

vi.mock("../../src/package-json/read", () => ({
  collectDirectDependencies: vi.fn<CollectDirectDependencies>(),
  readPackageManifest: vi.fn<ReadPackageManifest>(),
}));

vi.mock("../../src/pnpm/config", () => ({
  formatMinimumAgeShortLabel: vi.fn<FormatMinimumAgeShortLabel>(() => "7d"),
  resolveMinimumAgeMinutes: vi.fn<ResolveMinimumAgeMinutes>(),
}));

vi.mock("../../src/pnpm/overrides", () => ({
  applyPackageManifestUpdates: vi.fn<ApplyPackageManifestUpdates>(),
  recoverPackageJsonIfNeeded: vi.fn<RecoverPackageJsonIfNeeded>(),
}));

vi.mock("../../src/pnpm/runner", () => ({
  runPnpmCommand: vi.fn<RunPnpmCommand>(),
}));

vi.mock("../../src/registry/npm", () => ({
  fetchRegistryPackageMeta: vi.fn<FetchRegistryPackageMeta>(),
}));

import { runMatureCommand } from "../../src/commands/run";
import { selectMatureVersion } from "../../src/maturity/filter";
import { collectDirectDependencies, readPackageManifest } from "../../src/package-json/read";
import { resolveMinimumAgeMinutes } from "../../src/pnpm/config";
import { applyPackageManifestUpdates, recoverPackageJsonIfNeeded } from "../../src/pnpm/overrides";
import { runPnpmCommand } from "../../src/pnpm/runner";
import { fetchRegistryPackageMeta } from "../../src/registry/npm";
import type { CommandOptions, DependencySelection, RegistryPackageMeta } from "../../src/types";

describe("runMatureCommand", () => {
  const baseOptions: CommandOptions = {
    age: 7,
    dryRun: false,
    includeTransitive: false,
    projectDir: "D:/tmp/project",
    usePnpmGlobalConfig: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    asMock(resolveMinimumAgeMinutes).mockResolvedValue(10080);
    asMock(recoverPackageJsonIfNeeded).mockResolvedValue(undefined);
    asMock(readPackageManifest).mockResolvedValue({
      content: "{}",
      indent: "  ",
      manifest: {},
      path: "D:/tmp/project/package.json",
    });
    asMock(collectDirectDependencies).mockReturnValue({
      supported: [
        { field: "dependencies", name: "react", spec: "^18.0.0" },
        { field: "dependencies", name: "vite", spec: "^7.0.0" },
      ],
      unsupported: [
        {
          field: "dependencies",
          name: "workspace-lib",
          reason: "unsupported dependency protocol: workspace:*",
          spec: "workspace:*",
        },
      ],
    });
    asMock(fetchRegistryPackageMeta).mockImplementation(
      async (name: string) =>
        ({
          latestVersion: "1.0.0",
          name,
          versions: [],
        }) satisfies RegistryPackageMeta,
    );
    asMock(selectMatureVersion).mockImplementation((dependency) =>
      createSelection(dependency.name, dependency.spec),
    );
    asMock(applyPackageManifestUpdates).mockResolvedValue({
      commit: async () => {},
      rollback: async () => {},
    });
    asMock(runPnpmCommand).mockResolvedValue(0);
  });

  it("limits package.json updates and pnpm arguments to the requested dependency", async () => {
    await expect(
      runMatureCommand("update", { ...baseOptions, dependencyNames: ["react"] }),
    ).resolves.toBe(0);

    expect(fetchRegistryPackageMeta).toHaveBeenCalledTimes(1);
    expect(fetchRegistryPackageMeta).toHaveBeenCalledWith("react", {
      maxResponseMiB: undefined,
    });
    expect(selectMatureVersion).toHaveBeenCalledTimes(1);
    expect(applyPackageManifestUpdates).toHaveBeenCalledWith(baseOptions.projectDir, [
      { field: "dependencies", name: "react", version: "18.3.1" },
    ]);
    expect(runPnpmCommand).toHaveBeenCalledWith(baseOptions.projectDir, "update", ["react"]);
  });

  it("rejects requested dependencies that are missing or unsupported", async () => {
    await expect(
      runMatureCommand("update", {
        ...baseOptions,
        dependencyNames: ["workspace-lib", "missing-package"],
      }),
    ).rejects.toThrow(
      "Unable to target the requested dependencies: unsupported: workspace-lib@workspace:* (unsupported dependency protocol: workspace:*); not found: missing-package",
    );

    expect(fetchRegistryPackageMeta).not.toHaveBeenCalled();
    expect(runPnpmCommand).not.toHaveBeenCalled();
  });

  it("disposes signal handlers before re-raising termination signals", async () => {
    let sigintHandler: ((signal: NodeJS.Signals) => void) | undefined;
    const processOnce = vi.spyOn(process, "once");
    const removeListener = vi.spyOn(process, "removeListener");
    const processKill = vi.spyOn(process, "kill").mockImplementation(() => true);
    let restored = false;
    const rollback = vi.fn<() => Promise<void>>(async () => {
      if (restored) {
        return;
      }

      restored = true;
    });

    processOnce.mockImplementation(((event: string, listener: (...args: unknown[]) => void) => {
      if (event === "SIGINT") {
        sigintHandler = listener as (signal: NodeJS.Signals) => void;
      }

      return process;
    }) as typeof process.once);

    asMock(applyPackageManifestUpdates).mockResolvedValue({
      commit: async () => {},
      rollback,
    });
    asMock(runPnpmCommand).mockImplementation(async () => {
      sigintHandler?.("SIGINT");
      return 130;
    });

    await expect(
      runMatureCommand("update", { ...baseOptions, dependencyNames: ["react"] }),
    ).resolves.toBe(130);

    expect(rollback).toHaveBeenCalledTimes(1);
    expect(processKill).toHaveBeenCalledWith(process.pid, "SIGINT");
    expect(removeListener).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    const firstRemoveCall = removeListener.mock.invocationCallOrder[0];
    const firstKillCall = processKill.mock.invocationCallOrder[0];

    expect(firstRemoveCall).toBeDefined();
    expect(firstKillCall).toBeDefined();
    expect(firstRemoveCall!).toBeLessThan(firstKillCall!);

    processOnce.mockRestore();
    removeListener.mockRestore();
    processKill.mockRestore();
  });

  it("commits manifest updates after a successful pnpm run", async () => {
    const commit = vi.fn<() => Promise<void>>(async () => {});
    const rollback = vi.fn<() => Promise<void>>(async () => {});

    asMock(applyPackageManifestUpdates).mockResolvedValue({ commit, rollback });

    await expect(runMatureCommand("update", { ...baseOptions })).resolves.toBe(0);

    expect(commit).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
  });

  it("passes registry response size overrides to metadata fetches", async () => {
    await expect(
      runMatureCommand("update", {
        ...baseOptions,
        dependencyNames: ["react"],
        registryMaxResponseMiB: 256,
      }),
    ).resolves.toBe(0);

    expect(fetchRegistryPackageMeta).toHaveBeenCalledWith("react", {
      maxResponseMiB: 256,
    });
  });

  it("rejects invalid registry response size overrides", async () => {
    await expect(
      runMatureCommand("update", {
        ...baseOptions,
        registryMaxResponseMiB: 0,
      }),
    ).rejects.toThrow("--registry-max-response-mib must be a positive integer");

    expect(fetchRegistryPackageMeta).not.toHaveBeenCalled();
  });
});

function createSelection(name: string, spec: string): DependencySelection {
  return {
    dependency: {
      field: "dependencies",
      name,
      spec,
    },
    latest: {
      publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      version: "18.3.2",
    },
    selected: {
      publishedAt: new Date("2026-04-20T00:00:00.000Z"),
      version: name === "react" ? "18.3.1" : "7.1.8",
    },
    skippedIncompatible: 0,
    skippedRecent: [],
  };
}

function asMock(value: unknown): Mock {
  return value as Mock;
}

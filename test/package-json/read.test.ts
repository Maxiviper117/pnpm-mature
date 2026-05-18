import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { collectDirectDependencies, readPackageManifest } from "../../src/package-json/read";
import type { PackageManifest } from "../../src/types";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("collectDirectDependencies", () => {
  it("collects supported dependency groups and skips unsupported protocols", () => {
    const manifest: PackageManifest = {
      dependencies: {
        commander: "^14.0.3",
        localPkg: "file:../local-pkg",
      },
      devDependencies: {
        typescript: "^6.0.3",
      },
      optionalDependencies: {
        linkedTool: "link:../linked-tool",
      },
      peerDependencies: {
        semver: "^7.8.0",
      },
    };

    const result = collectDirectDependencies(manifest);

    expect(result.supported).toEqual([
      { field: "dependencies", name: "commander", spec: "^14.0.3" },
      { field: "devDependencies", name: "typescript", spec: "^6.0.3" },
      { field: "peerDependencies", name: "semver", spec: "^7.8.0" },
    ]);

    expect(result.unsupported).toEqual([
      {
        field: "dependencies",
        name: "localPkg",
        spec: "file:../local-pkg",
        reason: "unsupported dependency protocol: file:../local-pkg",
      },
      {
        field: "optionalDependencies",
        name: "linkedTool",
        spec: "link:../linked-tool",
        reason: "unsupported dependency protocol: link:../linked-tool",
      },
    ]);
  });

  it("classifies invalid package names as unsupported", () => {
    const manifest: PackageManifest = {
      dependencies: {
        "\u001b[31mevil\u001b[0m": "^1.0.0",
        react: "^18.0.0",
      },
    };

    const result = collectDirectDependencies(manifest);

    expect(result.supported).toEqual([{ field: "dependencies", name: "react", spec: "^18.0.0" }]);
    expect(result.unsupported).toEqual([
      {
        field: "dependencies",
        name: "\u001b[31mevil\u001b[0m",
        reason: "invalid package name",
        spec: "^1.0.0",
      },
    ]);
  });
});

describe("readPackageManifest", () => {
  it("throws a friendly error for invalid JSON", async () => {
    const projectDir = await createProjectDir('{\n  "name": "broken",\n');

    await expect(readPackageManifest(projectDir)).rejects.toThrow(/^Invalid package\.json:/);
  });

  it("rejects non-object dependency groups", async () => {
    const projectDir = await createProjectDir(JSON.stringify({ dependencies: null }, null, 2));

    await expect(readPackageManifest(projectDir)).rejects.toThrow(
      "Invalid package.json: dependencies must be an object mapping package names to strings",
    );
  });

  it("falls back to two spaces when no indentation can be detected", async () => {
    const projectDir = await createProjectDir('{"name":"pnpm-mature"}\n');

    await expect(readPackageManifest(projectDir)).resolves.toMatchObject({ indent: "  " });
  });
});

async function createProjectDir(packageJson: string): Promise<string> {
  const projectDir = await mkdtemp(path.join(os.tmpdir(), "pnpm-mature-read-"));
  tempDirs.push(projectDir);
  await writeFile(path.join(projectDir, "package.json"), packageJson, "utf8");
  return projectDir;
}

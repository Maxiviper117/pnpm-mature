import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyPackageManifestUpdates } from "../../src/pnpm/overrides";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("applyPackageManifestUpdates", () => {
  it("writes selected versions into package.json and keeps them after commit", async () => {
    const projectDir = await createProjectDir({
      dependencies: { express: "4.18.2" },
      devDependencies: { nodemon: "2.0.22" },
      name: "fixture",
      private: true,
    });

    const mutation = await applyPackageManifestUpdates(projectDir, [
      { field: "dependencies", name: "express", version: "4.22.2" },
      { field: "devDependencies", name: "nodemon", version: "2.0.23" },
    ]);

    await mutation.commit();

    await expect(readProjectPackageJson(projectDir)).resolves.toMatchObject({
      dependencies: { express: "4.22.2" },
      devDependencies: { nodemon: "2.0.23" },
    });
    await expect(access(path.join(projectDir, ".pnpm-mature.package.json.bak"))).rejects.toThrow(
      /ENOENT/,
    );
  });

  it("restores the original package.json on rollback", async () => {
    const projectDir = await createProjectDir({
      dependencies: { express: "4.18.2" },
      name: "fixture",
      private: true,
    });

    const mutation = await applyPackageManifestUpdates(projectDir, [
      { field: "dependencies", name: "express", version: "4.22.2" },
    ]);

    await mutation.rollback();

    await expect(readProjectPackageJson(projectDir)).resolves.toMatchObject({
      dependencies: { express: "4.18.2" },
    });
    await expect(access(path.join(projectDir, ".pnpm-mature.package.json.bak"))).rejects.toThrow(
      /ENOENT/,
    );
  });

  it("strips existing pnpm.overrides from the rewritten manifest", async () => {
    const projectDir = await createProjectDir({
      dependencies: { express: "4.18.2" },
      name: "fixture",
      pnpm: {
        overrides: { express: "4.22.2" },
        sharedWorkspaceLockfile: false,
      },
      private: true,
    });

    const mutation = await applyPackageManifestUpdates(projectDir, [
      { field: "dependencies", name: "express", version: "4.22.2" },
    ]);

    await mutation.commit();

    await expect(readProjectPackageJson(projectDir)).resolves.toMatchObject({
      dependencies: { express: "4.22.2" },
      pnpm: { sharedWorkspaceLockfile: false },
    });
  });
});

async function createProjectDir(packageJson: object): Promise<string> {
  const projectDir = await mkdtemp(path.join(os.tmpdir(), "pnpm-mature-overrides-"));
  tempDirs.push(projectDir);
  await writeFile(
    path.join(projectDir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf8",
  );
  return projectDir;
}

async function readProjectPackageJson(projectDir: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(projectDir, "package.json"), "utf8")) as unknown;
}

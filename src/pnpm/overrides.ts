import { access, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";

import { readPackageManifest } from "../package-json/read";
import type { PackageManifest } from "../types";

const BACKUP_FILENAME = ".pnpm-mature.package.json.bak";

export async function recoverPackageJsonIfNeeded(projectDir: string): Promise<void> {
  const backupPath = getBackupPath(projectDir);

  try {
    await access(backupPath, constants.F_OK);
  } catch {
    return;
  }

  const state = await readPackageManifest(projectDir);
  await writeFile(state.path, await readFile(backupPath, "utf8"), "utf8");
  await rm(backupPath, { force: true });
}

export async function applyTemporaryOverrides(
  projectDir: string,
  overrides: Record<string, string>,
): Promise<() => Promise<void>> {
  const state = await readPackageManifest(projectDir);
  const backupPath = getBackupPath(projectDir);

  if (Object.keys(overrides).length === 0) {
    return async () => {};
  }

  await writeFile(backupPath, state.content, { encoding: "utf8", flag: "wx" });

  const nextManifest = structuredClone(state.manifest);
  const nextPnpm = getMutablePnpmConfig(nextManifest);
  nextPnpm.overrides = {
    ...(nextPnpm.overrides ?? {}),
    ...overrides,
  };

  nextManifest.pnpm = nextPnpm;

  await writeFile(state.path, `${JSON.stringify(nextManifest, null, state.indent)}\n`, "utf8");

  let restored = false;

  return async () => {
    if (restored) {
      return;
    }

    restored = true;
    await writeFile(state.path, state.content, "utf8");
    await rm(backupPath, { force: true });
  };
}

function getBackupPath(projectDir: string): string {
  return path.join(projectDir, BACKUP_FILENAME);
}

function getMutablePnpmConfig(manifest: PackageManifest): NonNullable<PackageManifest["pnpm"]> {
  if (!manifest.pnpm) {
    return {};
  }

  if (typeof manifest.pnpm !== "object" || Array.isArray(manifest.pnpm)) {
    throw new Error("package.json contains a non-object pnpm field");
  }

  if (
    manifest.pnpm.overrides !== undefined &&
    (typeof manifest.pnpm.overrides !== "object" || Array.isArray(manifest.pnpm.overrides))
  ) {
    throw new Error("package.json contains a non-object pnpm.overrides field");
  }

  return {
    ...manifest.pnpm,
    overrides: manifest.pnpm.overrides ? { ...manifest.pnpm.overrides } : {},
  };
}

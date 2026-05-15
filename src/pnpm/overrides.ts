import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { readPackageManifest } from "../package-json/read";
import type { PackageManifest } from "../types";

const BACKUP_FILENAME = ".pnpm-mature.package.json.bak";

export async function recoverPackageJsonIfNeeded(projectDir: string): Promise<void> {
  const backupPath = getBackupPath(projectDir);
  let backupContent: string;

  try {
    backupContent = await readFile(backupPath, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return;
    }

    throw error;
  }

  try {
    JSON.parse(backupContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Backup package.json is invalid: ${message}`, { cause: error });
  }

  const state = await readPackageManifest(projectDir);
  await writeFile(state.path, backupContent, "utf8");
  await rm(backupPath, { force: true });
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
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

import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { readPackageManifest } from "../package-json/read";
import type { DependencyField, PackageManifest } from "../types";

const BACKUP_FILENAME = ".pnpm-mature.package.json.bak";

export interface PackageManifestUpdate {
  field: DependencyField;
  name: string;
  version: string;
}

export interface PackageManifestMutation {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

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

export async function applyPackageManifestUpdates(
  projectDir: string,
  updates: PackageManifestUpdate[],
): Promise<PackageManifestMutation> {
  const state = await readPackageManifest(projectDir);
  const backupPath = getBackupPath(projectDir);

  if (updates.length === 0) {
    return {
      commit: async () => {},
      rollback: async () => {},
    };
  }

  await writeFile(backupPath, state.content, { encoding: "utf8", flag: "wx" });

  const nextManifest = structuredClone(state.manifest);

  for (const update of updates) {
    const group = getMutableDependencyGroup(nextManifest, update.field);
    group[update.name] = update.version;
  }

  removeTemporaryOverrides(nextManifest);

  await writeFile(state.path, `${JSON.stringify(nextManifest, null, state.indent)}\n`, "utf8");

  let finalized = false;

  return {
    commit: async () => {
      if (finalized) {
        return;
      }

      finalized = true;
      await rm(backupPath, { force: true });
    },
    rollback: async () => {
      if (finalized) {
        return;
      }

      finalized = true;
      await writeFile(state.path, state.content, "utf8");
      await rm(backupPath, { force: true });
    },
  };
}

function getBackupPath(projectDir: string): string {
  return path.join(projectDir, BACKUP_FILENAME);
}

function getMutableDependencyGroup(
  manifest: PackageManifest,
  field: DependencyField,
): Record<string, string> {
  const group = manifest[field];

  if (!group || typeof group !== "object" || Array.isArray(group)) {
    throw new Error(`package.json contains a non-object ${field} field`);
  }

  return group;
}

function removeTemporaryOverrides(manifest: PackageManifest): void {
  if (!manifest.pnpm || typeof manifest.pnpm !== "object" || Array.isArray(manifest.pnpm)) {
    return;
  }

  if ("overrides" in manifest.pnpm) {
    const { overrides: _overrides, ...remainingPnpm } = manifest.pnpm;

    if (Object.keys(remainingPnpm).length === 0) {
      delete manifest.pnpm;
      return;
    }

    manifest.pnpm = remainingPnpm;
  }
}

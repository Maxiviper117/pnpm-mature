import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  DependencyField,
  DependencySpec,
  PackageManifest,
  UnsupportedDependency,
} from "../types";

const SUPPORTED_FIELDS: DependencyField[] = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const UNSUPPORTED_PREFIXES = [
  "workspace:",
  "file:",
  "link:",
  "git:",
  "git+",
  "catalog:",
  "npm:",
  "jsr:",
  "http:",
  "https:",
  "ssh:",
  "github:",
];

export interface PackageManifestState {
  path: string;
  content: string;
  indent: string;
  manifest: PackageManifest;
}

export async function readPackageManifest(projectDir: string): Promise<PackageManifestState> {
  const manifestPath = path.join(projectDir, "package.json");
  const content = await readFile(manifestPath, "utf8");

  return {
    path: manifestPath,
    content,
    indent: detectIndentation(content),
    manifest: JSON.parse(content) as PackageManifest,
  };
}

export function collectDirectDependencies(manifest: PackageManifest): {
  supported: DependencySpec[];
  unsupported: UnsupportedDependency[];
} {
  const supported: DependencySpec[] = [];
  const unsupported: UnsupportedDependency[] = [];

  for (const field of SUPPORTED_FIELDS) {
    const group = manifest[field];

    if (!group) {
      continue;
    }

    for (const [name, spec] of Object.entries(group)) {
      const reason = getUnsupportedReason(spec);

      if (reason) {
        unsupported.push({ field, name, spec, reason });
        continue;
      }

      supported.push({ field, name, spec });
    }
  }

  return { supported, unsupported };
}

function detectIndentation(content: string): string {
  const match = content.match(/^([ \t]+)"/m);
  return match?.[1] ?? "  ";
}

function getUnsupportedReason(spec: string): string | undefined {
  const normalized = spec.trim().toLowerCase();

  if (!normalized) {
    return "empty dependency spec";
  }

  if (UNSUPPORTED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return `unsupported dependency protocol: ${spec}`;
  }

  if (normalized.includes("://") || normalized.startsWith("git@")) {
    return `unsupported dependency protocol: ${spec}`;
  }

  return undefined;
}

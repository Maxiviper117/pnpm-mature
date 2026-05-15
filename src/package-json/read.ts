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
  const manifest = parsePackageManifest(content);

  return {
    path: manifestPath,
    content,
    indent: detectIndentation(content),
    manifest,
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
  const indent = match?.[1];

  if (!indent || /[^ \t]/.test(indent)) {
    return "  ";
  }

  return indent;
}

function parsePackageManifest(content: string): PackageManifest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid package.json: ${message}`, { cause: error });
  }

  if (!isPlainObject(parsed)) {
    throw new Error("Invalid package.json: top-level value must be a JSON object");
  }

  const manifest = parsed as PackageManifest;

  if (manifest.pnpm !== undefined && !isPlainObject(manifest.pnpm)) {
    throw new Error("Invalid package.json: pnpm field must be an object");
  }

  for (const field of SUPPORTED_FIELDS) {
    const group = manifest[field];

    if (group === undefined) {
      continue;
    }

    if (!isRecordOfStrings(group)) {
      throw new Error(
        `Invalid package.json: ${field} must be an object mapping package names to strings`,
      );
    }
  }

  return manifest;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return isPlainObject(value) && Object.values(value).every((entry) => typeof entry === "string");
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

import * as semver from "semver";

import type { RegistryPackageMeta, RegistryVersionMeta } from "../types";

const REGISTRY_URL = "https://registry.npmjs.org";
const REGISTRY_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_PACKUMENT_MIB = 100;
const BYTES_PER_MIB = 1024 * 1024;

interface RegistryFetchOptions {
  maxResponseMiB?: number;
}

interface RegistryPackument {
  name?: string;
  time?: Record<string, string>;
  versions?: Record<string, { deprecated?: string }>;
  "dist-tags"?: {
    latest?: string;
  };
}

export async function fetchRegistryPackageMeta(
  packageName: string,
  options: RegistryFetchOptions = {},
): Promise<RegistryPackageMeta> {
  const response = await fetch(`${REGISTRY_URL}/${encodeURIComponent(packageName)}`, {
    redirect: "error",
    signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${packageName} from npm registry (${response.status} ${response.statusText})`,
    );
  }

  const maxResponseMiB = options.maxResponseMiB ?? DEFAULT_MAX_PACKUMENT_MIB;
  const packument = await readPackument(packageName, response, maxResponseMiB);
  const versions = collectVersions(packument);

  return {
    name: packument.name ?? packageName,
    latestVersion: packument["dist-tags"]?.latest,
    versions,
  };
}

async function readPackument(
  packageName: string,
  response: Response,
  maxResponseMiB: number,
): Promise<RegistryPackument> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("npm registry returned an empty response body");
  }

  const chunks: Uint8Array[] = [];
  const maxPackumentBytes = maxResponseMiB * BYTES_PER_MIB;
  let totalBytes = 0;

  while (true) {
    // The stream must be consumed chunk-by-chunk to enforce a byte limit.
    // oxlint-disable-next-line eslint/no-await-in-loop
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxPackumentBytes) {
      throw new Error(
        `npm registry response for ${packageName} exceeded the ${maxResponseMiB} MiB safety limit. To allow a larger response, rerun with --max-registry-mib <mib>.`,
      );
    }

    chunks.push(value);
  }

  const body = new TextDecoder().decode(concatenateChunks(chunks, totalBytes));
  const parsed = JSON.parse(body) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("npm registry returned an invalid packument payload");
  }

  return parsed as RegistryPackument;
}

function concatenateChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const combined = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return combined;
}

function collectVersions(packument: RegistryPackument): RegistryVersionMeta[] {
  const times = packument.time ?? {};
  const versionEntries = Object.entries(packument.versions ?? {});

  const versions: RegistryVersionMeta[] = [];

  for (const [version, manifest] of versionEntries) {
    const publishedAt = times[version];

    if (!publishedAt || !semver.valid(version)) {
      continue;
    }

    const publishedAtDate = new Date(publishedAt);

    if (Number.isNaN(publishedAtDate.getTime())) {
      continue;
    }

    versions.push({
      version,
      publishedAt: publishedAtDate,
      deprecated: manifest.deprecated,
    });
  }

  return versions.sort((left, right) => semver.rcompare(left.version, right.version));
}

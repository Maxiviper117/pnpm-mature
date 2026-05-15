import * as semver from "semver";

import type { RegistryPackageMeta, RegistryVersionMeta } from "../types";

interface RegistryPackument {
  name?: string;
  time?: Record<string, string>;
  versions?: Record<string, { deprecated?: string }>;
  "dist-tags"?: {
    latest?: string;
  };
}

export async function fetchRegistryPackageMeta(packageName: string): Promise<RegistryPackageMeta> {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${packageName} from npm registry (${response.status} ${response.statusText})`,
    );
  }

  const packument = (await response.json()) as RegistryPackument;
  const versions = collectVersions(packument);

  return {
    name: packument.name ?? packageName,
    latestVersion: packument["dist-tags"]?.latest,
    versions,
  };
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

    versions.push({
      version,
      publishedAt: new Date(publishedAt),
      deprecated: manifest.deprecated,
    });
  }

  return versions.sort((left, right) => semver.rcompare(left.version, right.version));
}

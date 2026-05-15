import * as semver from "semver";

import type { DependencySelection, DependencySpec, RegistryPackageMeta } from "../types";
import { formatMinimumAgeLongLabel } from "../pnpm/config";
import type { CommandOptions } from "../types";

export function selectMatureVersion(
  dependency: DependencySpec,
  registryMeta: RegistryPackageMeta,
  minimumAgeMinutes: number,
  ignorePinned: CommandOptions["ignorePinned"] = undefined,
  now = new Date(),
): DependencySelection {
  const cutoff = new Date(now.getTime() - minimumAgeMinutes * 60 * 1000);
  const latest = resolveLatestVersion(registryMeta);
  const effectiveSpec = resolveEffectiveSpec(dependency.spec, ignorePinned);
  const compatible = registryMeta.versions.filter((version) =>
    semver.satisfies(version.version, effectiveSpec),
  );
  const skippedRecent = compatible.filter((version) => version.publishedAt > cutoff);
  const selected = compatible.find((version) => version.publishedAt <= cutoff);

  if (!selected) {
    return {
      dependency,
      latest,
      skippedRecent,
      skippedIncompatible: registryMeta.versions.length - compatible.length,
      reason:
        compatible.length === 0
          ? `No registry versions satisfy ${describeEffectiveSpec(dependency.spec, effectiveSpec, ignorePinned)}`
          : `No compatible versions are older than ${formatMinimumAgeLongLabel(minimumAgeMinutes)}`,
    };
  }

  return {
    dependency,
    latest,
    selected,
    skippedRecent,
    skippedIncompatible: registryMeta.versions.length - compatible.length,
  };
}

function resolveLatestVersion(registryMeta: RegistryPackageMeta) {
  if (registryMeta.latestVersion) {
    const taggedLatest = registryMeta.versions.find(
      (version) => version.version === registryMeta.latestVersion,
    );

    if (taggedLatest) {
      return taggedLatest;
    }
  }

  const latestStable = registryMeta.versions.find(
    (version) => semver.prerelease(version.version) === null,
  );
  return latestStable ?? registryMeta.versions[0];
}

function resolveEffectiveSpec(
  declaredSpec: string,
  ignorePinned: CommandOptions["ignorePinned"],
): string {
  if (!ignorePinned) {
    return declaredSpec;
  }

  const pinnedVersion = semver.valid(declaredSpec);

  if (!pinnedVersion) {
    return declaredSpec;
  }

  const parsedVersion = semver.parse(pinnedVersion);

  if (!parsedVersion) {
    return declaredSpec;
  }

  if (ignorePinned === "major" || ignorePinned === "all") {
    return `>=${pinnedVersion}`;
  }

  return `>=${pinnedVersion} <${parsedVersion.major + 1}.0.0`;
}

function describeEffectiveSpec(
  declaredSpec: string,
  effectiveSpec: string,
  ignorePinned: CommandOptions["ignorePinned"],
): string {
  if (!ignorePinned || effectiveSpec === declaredSpec) {
    return `declared range ${declaredSpec}`;
  }

  return `effective range ${effectiveSpec} from pinned ${declaredSpec} (--ignore-pinned ${ignorePinned})`;
}

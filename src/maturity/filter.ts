import * as semver from "semver";

import type { DependencySelection, DependencySpec, RegistryPackageMeta } from "../types";
import { formatMinimumAgeLongLabel } from "../pnpm/config";
import type { CommandOptions } from "../types";

export function selectMatureVersion(
  dependency: DependencySpec,
  registryMeta: RegistryPackageMeta,
  minimumAgeMinutes: number,
  relax: CommandOptions["relax"] = undefined,
  now = new Date(),
): DependencySelection {
  const cutoff = new Date(now.getTime() - minimumAgeMinutes * 60 * 1000);
  const latest = resolveLatestVersion(registryMeta);
  const effectiveSpec = resolveEffectiveSpec(dependency.spec, relax);
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
          ? `No registry versions satisfy ${describeEffectiveSpec(dependency.spec, effectiveSpec, relax)}`
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

function resolveEffectiveSpec(declaredSpec: string, relax: CommandOptions["relax"]): string {
  if (!relax) {
    return declaredSpec;
  }

  const pinnedVersion = semver.valid(declaredSpec);
  if (pinnedVersion) {
    return widenSpec(pinnedVersion, relax);
  }

  const coerced = semver.coerce(declaredSpec);
  if (coerced) {
    return widenSpec(coerced.version, relax);
  }

  return declaredSpec;
}

function widenSpec(version: string, level: "all" | "major" | "minor"): string {
  const parsedVersion = semver.parse(version);

  if (parsedVersion && level === "minor") {
    return `* <${parsedVersion.major + 1}.0.0`;
  }

  return `*`;
}

function describeEffectiveSpec(
  declaredSpec: string,
  effectiveSpec: string,
  relax: CommandOptions["relax"],
): string {
  if (effectiveSpec === declaredSpec || !relax) {
    return `declared range ${declaredSpec}`;
  }

  return `effective range ${effectiveSpec} from ${declaredSpec} (--relax ${relax})`;
}

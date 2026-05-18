import { InvalidArgumentError } from "commander";

const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function isValidPackageName(name: string): boolean {
  return PACKAGE_NAME_PATTERN.test(name);
}

export function normalizeDependencyNames(packages: string[]): string[] | undefined {
  if (packages.length === 0) {
    return undefined;
  }

  const uniquePackages = [...new Set(packages)];
  const invalidPackages = uniquePackages.filter((name) => !isValidPackageName(name));

  if (invalidPackages.length > 0) {
    throw new InvalidArgumentError(
      `invalid package name${invalidPackages.length === 1 ? "" : "s"}: ${invalidPackages.join(", ")}`,
    );
  }

  return uniquePackages;
}

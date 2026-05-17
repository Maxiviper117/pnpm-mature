import * as semver from "semver";

import pc from "picocolors";

const REGISTRY_URL = "https://registry.npmjs.org";
const VERSION_CHECK_TIMEOUT_MS = 5_000;
const PACKAGE_NAME = "@maxiviper117/pnpm-mature";

export async function checkForNewVersion(currentVersion: string): Promise<string | null> {
  try {
    const encodedName = PACKAGE_NAME.replace("/", "%2F");
    const response = await fetch(`${REGISTRY_URL}/${encodedName}`, {
      signal: AbortSignal.timeout(VERSION_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      "dist-tags"?: { latest?: string };
    };
    const latest = data?.["dist-tags"]?.latest;

    if (!latest || !semver.valid(latest)) {
      return null;
    }

    if (semver.gt(latest, currentVersion)) {
      return [
        pc.yellow(`A new version of pnpm-mature is available: ${currentVersion} → ${latest}.`),
        ` Run ${pc.bold(`npm install -g ${PACKAGE_NAME}`)} to update.`,
      ].join("");
    }

    return null;
  } catch {
    return null;
  }
}

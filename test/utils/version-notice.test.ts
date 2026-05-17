import { describe, expect, it } from "vitest";

import { checkForNewVersion } from "../../src/utils/version-notice";

function stripAnsi(text: string): string {
  // oxlint-disable-next-line no-control-regex
  return text.replace(/\u001b\[\d+(;\d+)*m/g, "");
}

describe("checkForNewVersion (live registry)", () => {
  it("detects a newer version available on npm", async () => {
    const result = await checkForNewVersion("0.0.0");

    expect(result).not.toBeNull();
    expect(stripAnsi(result!)).toContain("A new version of pnpm-mature is available");
  }, 15_000);

  it("returns null when already far ahead of the published version", async () => {
    const result = await checkForNewVersion("999.999.999");

    expect(result).toBeNull();
  }, 15_000);
});

import { describe, expect, it, vi } from "vitest";

import {
  formatMinimumAgeLongLabel,
  formatMinimumAgeShortLabel,
  parseMinimumReleaseAgeMinutes,
  resolveMinimumAgeMinutes,
} from "../../src/pnpm/config";
import type { CommandOptions } from "../../src/types";

describe("parseMinimumReleaseAgeMinutes", () => {
  it("returns a positive integer for valid config values", () => {
    expect(parseMinimumReleaseAgeMinutes("7")).toBe(7);
    expect(parseMinimumReleaseAgeMinutes(" 30 ")).toBe(30);
  });

  it("returns undefined for missing or invalid config values", () => {
    expect(parseMinimumReleaseAgeMinutes(undefined)).toBeUndefined();
    expect(parseMinimumReleaseAgeMinutes("undefined")).toBeUndefined();
    expect(parseMinimumReleaseAgeMinutes("0")).toBeUndefined();
    expect(parseMinimumReleaseAgeMinutes("-5")).toBeUndefined();
    expect(parseMinimumReleaseAgeMinutes("abc")).toBeUndefined();
  });
});

describe("resolveMinimumAgeMinutes", () => {
  const baseOptions: CommandOptions = {
    dryRun: false,
    includeTransitive: false,
    projectDir: "D:/tmp/project",
    usePnpmGlobalConfig: false,
  };

  it("prefers the explicit --age option", async () => {
    const readConfigValue = vi.fn<PersistedConfigReader>().mockResolvedValue("15");

    await expect(
      resolveMinimumAgeMinutes({ ...baseOptions, age: 7 }, readConfigValue),
    ).resolves.toBe(10080);
    expect(readConfigValue).not.toHaveBeenCalled();
  });

  it("falls back to pnpm global minimumReleaseAge when the flag is enabled", async () => {
    const readConfigValue = vi.fn<PersistedConfigReader>().mockResolvedValue("21");

    await expect(
      resolveMinimumAgeMinutes({ ...baseOptions, usePnpmGlobalConfig: true }, readConfigValue),
    ).resolves.toBe(21);
    expect(readConfigValue).toHaveBeenCalledWith("minimumReleaseAge");
  });

  it("throws when neither --age nor --use-pnpm-global-config is provided", async () => {
    await expect(resolveMinimumAgeMinutes(baseOptions)).rejects.toThrow(
      "Provide --age <days> or --use-pnpm-global-config",
    );
  });

  it("throws when pnpm global minimumReleaseAge is missing or invalid", async () => {
    const readConfigValue = vi.fn<PersistedConfigReader>().mockResolvedValue("undefined");

    await expect(
      resolveMinimumAgeMinutes({ ...baseOptions, usePnpmGlobalConfig: true }, readConfigValue),
    ).rejects.toThrow(
      "pnpm global config minimumReleaseAge is not set to a positive integer number of minutes",
    );
  });
});

describe("minimum age labels", () => {
  it("formats day-based values compactly when they land on full days", () => {
    expect(formatMinimumAgeShortLabel(10080)).toBe("7d");
    expect(formatMinimumAgeLongLabel(10080)).toBe("7 days");
  });

  it("formats minute-based values when they do not land on full days", () => {
    expect(formatMinimumAgeShortLabel(21)).toBe("21m");
    expect(formatMinimumAgeLongLabel(21)).toBe("21 minutes");
  });
});

type PersistedConfigReader = (key: string) => Promise<string | undefined>;

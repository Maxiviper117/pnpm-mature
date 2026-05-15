import { describe, expect, it } from "vitest";

import { selectMatureVersion } from "../../src/maturity/filter";
import type { DependencySpec, RegistryPackageMeta } from "../../src/types";

describe("selectMatureVersion", () => {
  const dependency: DependencySpec = {
    field: "dependencies",
    name: "vite",
    spec: "^7.0.0",
  };

  const registryMeta: RegistryPackageMeta = {
    name: "vite",
    latestVersion: "7.2.0",
    versions: [
      { version: "7.2.0", publishedAt: new Date("2026-05-13T00:00:00.000Z") },
      { version: "7.1.8", publishedAt: new Date("2026-05-03T00:00:00.000Z") },
      { version: "7.0.4", publishedAt: new Date("2026-04-20T00:00:00.000Z") },
      { version: "8.0.0", publishedAt: new Date("2026-05-01T00:00:00.000Z") },
      { version: "7.3.0-beta.1", publishedAt: new Date("2026-05-10T00:00:00.000Z") },
    ],
  };

  it("selects the newest compatible version older than the age threshold", () => {
    const result = selectMatureVersion(
      dependency,
      registryMeta,
      7 * 24 * 60,
      undefined,
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.latest?.version).toBe("7.2.0");
    expect(result.selected?.version).toBe("7.1.8");
    expect(result.skippedRecent.map((version) => version.version)).toEqual(["7.2.0"]);
    expect(result.reason).toBeUndefined();
  });

  it("returns a reason when no compatible version is old enough", () => {
    const result = selectMatureVersion(
      dependency,
      {
        ...registryMeta,
        versions: [
          { version: "7.2.0", publishedAt: new Date("2026-05-13T00:00:00.000Z") },
          { version: "7.1.9", publishedAt: new Date("2026-05-12T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      undefined,
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected).toBeUndefined();
    expect(result.reason).toBe("No compatible versions are older than 7 days");
  });

  it("reports minute-based thresholds when they do not align to full days", () => {
    const result = selectMatureVersion(
      dependency,
      {
        ...registryMeta,
        versions: [{ version: "7.2.0", publishedAt: new Date("2026-05-14T23:50:00.000Z") }],
      },
      21,
      undefined,
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.reason).toBe("No compatible versions are older than 21 minutes");
  });

  it("widens exact pinned versions to the latest mature version within the same major", () => {
    const result = selectMatureVersion(
      {
        field: "dependencies",
        name: "express",
        spec: "4.18.2",
      },
      {
        name: "express",
        latestVersion: "5.2.1",
        versions: [
          { version: "5.2.1", publishedAt: new Date("2026-05-10T00:00:00.000Z") },
          { version: "4.21.2", publishedAt: new Date("2026-04-20T00:00:00.000Z") },
          { version: "4.18.2", publishedAt: new Date("2022-10-08T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      "minor",
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected?.version).toBe("4.21.2");
    expect(result.skippedRecent.map((version) => version.version)).toEqual([]);
  });

  it("widens exact pinned versions across majors when requested", () => {
    const result = selectMatureVersion(
      {
        field: "dependencies",
        name: "express",
        spec: "4.18.2",
      },
      {
        name: "express",
        latestVersion: "5.2.1",
        versions: [
          { version: "5.2.1", publishedAt: new Date("2026-04-20T00:00:00.000Z") },
          { version: "4.21.2", publishedAt: new Date("2026-03-20T00:00:00.000Z") },
          { version: "4.18.2", publishedAt: new Date("2022-10-08T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      "major",
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected?.version).toBe("5.2.1");
  });

  it("treats ignore-pinned all like the fully widened mode", () => {
    const result = selectMatureVersion(
      {
        field: "dependencies",
        name: "express",
        spec: "4.18.2",
      },
      {
        name: "express",
        latestVersion: "5.2.1",
        versions: [
          { version: "5.2.1", publishedAt: new Date("2026-04-20T00:00:00.000Z") },
          { version: "4.21.2", publishedAt: new Date("2026-03-20T00:00:00.000Z") },
          { version: "4.18.2", publishedAt: new Date("2022-10-08T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      "all",
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected?.version).toBe("5.2.1");
  });

  it("keeps existing semver ranges unchanged when --ignore-pinned is used", () => {
    const result = selectMatureVersion(
      dependency,
      registryMeta,
      7 * 24 * 60,
      "minor",
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected?.version).toBe("7.1.8");
  });
});

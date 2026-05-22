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

  it("relaxes exact pinned versions within the same major with --relax minor", () => {
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
    );

    expect(result.selected?.version).toBe("4.21.2");
    expect(result.skippedRecent.map((version) => version.version)).toEqual([]);
  });

  it("relaxes exact pinned versions across majors with --relax major", () => {
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
    );

    expect(result.selected?.version).toBe("5.2.1");
  });

  it("fully relaxes with --relax all", () => {
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
    );

    expect(result.selected?.version).toBe("5.2.1");
  });

  it("drops to an older major when no same-major version is mature with --relax all", () => {
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
          { version: "5.2.1", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          { version: "4.21.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          { version: "4.18.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          { version: "3.9.0", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      "all",
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected?.version).toBe("3.9.0");
    expect(result.reason).toBeUndefined();
  });

  it("drops to an older major when no same-major version is mature with --relax minor", () => {
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
          { version: "5.2.1", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          { version: "4.21.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          { version: "4.18.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          { version: "3.9.0", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      "minor",
      new Date("2026-05-15T00:00:00.000Z"),
    );

    expect(result.selected?.version).toBe("3.9.0");
    expect(result.reason).toBeUndefined();
  });

  it("prefers a newer major over an older major with --relax all", () => {
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
          { version: "5.2.1", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
          { version: "4.21.2", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
          { version: "3.9.0", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
        ],
      },
      7 * 24 * 60,
      "all",
    );

    expect(result.selected?.version).toBe("5.2.1");
  });

  describe("--relax", () => {
    it("relaxes a semver range lower bound with --relax minor", () => {
      const result = selectMatureVersion(
        dependency,
        registryMeta,
        7 * 24 * 60,
        "minor",
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(result.selected?.version).toBe("7.1.8");
    });

    it("relaxes a semver range downward below the declared lower bound with --relax minor", () => {
      const result = selectMatureVersion(
        {
          field: "dependencies",
          name: "@types/node",
          spec: "^25.8.0",
        },
        {
          name: "@types/node",
          latestVersion: "25.8.0",
          versions: [
            { version: "25.8.0", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "24.9.0", publishedAt: new Date("2025-06-01T00:00:00.000Z") },
          ],
        },
        7 * 24 * 60,
        "minor",
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(result.selected?.version).toBe("24.9.0");
    });

    it("relaxes a semver range across majors with --relax all", () => {
      const result = selectMatureVersion(
        {
          field: "dependencies",
          name: "@types/node",
          spec: "^25.8.0",
        },
        {
          name: "@types/node",
          latestVersion: "25.8.0",
          versions: [
            { version: "25.8.0", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "22.5.0", publishedAt: new Date("2025-06-01T00:00:00.000Z") },
            { version: "25.7.0", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
          ],
        },
        7 * 24 * 60,
        "all",
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(result.selected?.version).toBe("22.5.0");
    });

    it("drops range specs to an older major with --relax all", () => {
      const result = selectMatureVersion(
        {
          field: "dependencies",
          name: "express",
          spec: "^4.18.0",
        },
        {
          name: "express",
          latestVersion: "5.2.1",
          versions: [
            { version: "5.2.1", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "4.21.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "4.18.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "3.9.0", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
          ],
        },
        7 * 24 * 60,
        "all",
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(result.selected?.version).toBe("3.9.0");
      expect(result.reason).toBeUndefined();
    });

    it("drops range specs to an older major with --relax minor", () => {
      const result = selectMatureVersion(
        {
          field: "dependencies",
          name: "express",
          spec: "^4.18.0",
        },
        {
          name: "express",
          latestVersion: "5.2.1",
          versions: [
            { version: "5.2.1", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "4.21.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "4.18.2", publishedAt: new Date("2026-05-14T00:00:00.000Z") },
            { version: "3.9.0", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
          ],
        },
        7 * 24 * 60,
        "minor",
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(result.selected?.version).toBe("3.9.0");
      expect(result.reason).toBeUndefined();
    });

    it("prefers a newer major over an older major with --relax all", () => {
      const result = selectMatureVersion(
        {
          field: "dependencies",
          name: "express",
          spec: "^4.18.0",
        },
        {
          name: "express",
          latestVersion: "5.2.1",
          versions: [
            { version: "5.2.1", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
            { version: "4.21.2", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
            { version: "3.9.0", publishedAt: new Date("2025-01-15T00:00:00.000Z") },
          ],
        },
        7 * 24 * 60,
        "all",
        new Date("2026-05-15T00:00:00.000Z"),
      );

      expect(result.selected?.version).toBe("5.2.1");
    });
  });
});

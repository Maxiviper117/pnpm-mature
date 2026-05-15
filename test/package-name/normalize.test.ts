import { InvalidArgumentError } from "commander";
import { describe, expect, it } from "vitest";

import { normalizeDependencyNames } from "../../src/package-name/normalize";

describe("normalizeDependencyNames", () => {
  it("deduplicates valid package names", () => {
    expect(normalizeDependencyNames(["react", "@types/node", "react"])).toEqual([
      "react",
      "@types/node",
    ]);
  });

  it("returns undefined when no package names are provided", () => {
    expect(normalizeDependencyNames([])).toBeUndefined();
  });

  it("rejects invalid package names", () => {
    expect(() => normalizeDependencyNames(["react", "lodash & calc.exe"])).toThrow(
      InvalidArgumentError,
    );
    expect(() => normalizeDependencyNames(["react", "lodash & calc.exe"])).toThrow(
      "invalid package name: lodash & calc.exe",
    );
  });
});

import { describe, expect, it } from "vitest";

import { collectDirectDependencies } from "../../src/package-json/read";
import type { PackageManifest } from "../../src/types";

describe("collectDirectDependencies", () => {
  it("collects supported dependency groups and skips unsupported protocols", () => {
    const manifest: PackageManifest = {
      dependencies: {
        commander: "^14.0.3",
        localPkg: "file:../local-pkg",
      },
      devDependencies: {
        typescript: "^6.0.3",
      },
      optionalDependencies: {
        linkedTool: "link:../linked-tool",
      },
      peerDependencies: {
        semver: "^7.8.0",
      },
    };

    const result = collectDirectDependencies(manifest);

    expect(result.supported).toEqual([
      { field: "dependencies", name: "commander", spec: "^14.0.3" },
      { field: "devDependencies", name: "typescript", spec: "^6.0.3" },
      { field: "peerDependencies", name: "semver", spec: "^7.8.0" },
    ]);

    expect(result.unsupported).toEqual([
      {
        field: "dependencies",
        name: "localPkg",
        spec: "file:../local-pkg",
        reason: "unsupported dependency protocol: file:../local-pkg",
      },
      {
        field: "optionalDependencies",
        name: "linkedTool",
        spec: "link:../linked-tool",
        reason: "unsupported dependency protocol: link:../linked-tool",
      },
    ]);
  });
});

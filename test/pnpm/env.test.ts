import { describe, expect, it } from "vitest";

import { createPnpmChildEnv } from "../../src/pnpm/env";

describe("createPnpmChildEnv", () => {
  it("removes Node runtime injection variables while preserving pnpm config", () => {
    expect(
      createPnpmChildEnv({
        BUN_OPTIONS: "--preload ./malicious.ts",
        NODE_OPTIONS: "--require ./malicious.js",
        NODE_PATH: "./shadow-modules",
        NPM_CONFIG_REGISTRY: "https://registry.example.test",
        PATH: "/usr/bin",
      }),
    ).toEqual({
      NPM_CONFIG_REGISTRY: "https://registry.example.test",
      PATH: "/usr/bin",
    });
  });
});

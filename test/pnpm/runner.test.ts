import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SpawnMock = (
  command: string,
  args: string[],
  options: { cwd: string; shell: boolean; stdio: "inherit" },
) => {
  once: (event: string, handler: (...args: unknown[]) => void) => void;
};

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn<SpawnMock>(),
}));

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
}));

import { runPnpmCommand } from "../../src/pnpm/runner";

describe("runPnpmCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spawnMock.mockReturnValue(createChildProcessDouble());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses direct pnpm execution without a shell on Windows", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");

    await expect(runPnpmCommand("D:/tmp/project", "update", ["react"])).resolves.toBe(0);

    expect(spawnMock).toHaveBeenCalledWith("pnpm.cmd", ["update", "react"], {
      cwd: "D:/tmp/project",
      shell: false,
      stdio: "inherit",
    });
  });
});

function createChildProcessDouble(): {
  once: (event: string, handler: (...args: unknown[]) => void) => void;
} {
  return {
    once: (event, handler) => {
      if (event === "close") {
        handler(0);
      }
    },
  };
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SpawnMock = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; shell: boolean; stdio: "inherit" },
) => {
  once: (event: string, handler: (...args: unknown[]) => void) => void;
};

let spawnMock: ReturnType<typeof vi.fn<SpawnMock>>;

describe("runPnpmCommand", () => {
  beforeEach(() => {
    vi.resetModules();
    spawnMock = vi.fn<SpawnMock>();
    spawnMock.mockReturnValue(createChildProcessDouble());
    vi.doMock("node:child_process", () => ({
      spawn: spawnMock,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("uses direct pnpm execution without a shell on Windows", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    const { runPnpmCommand } = await import("../../src/pnpm/runner");

    await expect(runPnpmCommand("D:/tmp/project", "update", ["react"])).resolves.toBe(0);

    expect(spawnMock).toHaveBeenCalledWith("pnpm", ["update", "react"], {
      cwd: "D:/tmp/project",
      env: expect.objectContaining({}),
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

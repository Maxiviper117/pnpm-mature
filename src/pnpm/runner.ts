import { spawn } from "node:child_process";

import { createPnpmChildEnv } from "./env";

export async function runPnpmCommand(
  projectDir: string,
  command: "update" | "install",
  args: string[] = [],
): Promise<number> {
  const isWindows = process.platform === "win32";
  const spawnArgs = [command, ...args];

  return await new Promise<number>((resolve, reject) => {
    const child = spawn(
      isWindows ? `pnpm ${escapeShellArgs(spawnArgs)}` : "pnpm",
      isWindows ? [] : spawnArgs,
      {
        cwd: projectDir,
        env: createPnpmChildEnv(),
        stdio: "inherit",
        shell: isWindows,
      },
    );

    child.once("error", (error) => {
      reject(new Error(`Failed to start pnpm: ${error.message}`));
    });

    child.once("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

function escapeShellArgs(args: string[]): string {
  return args
    .map((arg) => {
      if (/[ \t"&|<>()^]/.test(arg)) {
        return `"${arg.replace(/"/g, '\\"')}"`;
      }
      return arg;
    })
    .join(" ");
}

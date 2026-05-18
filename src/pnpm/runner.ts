import { spawn } from "node:child_process";

import { createPnpmChildEnv } from "./env";

export async function runPnpmCommand(
  projectDir: string,
  command: "update" | "install",
  args: string[] = [],
): Promise<number> {
  const executable = "pnpm";

  return await new Promise<number>((resolve, reject) => {
    const child = spawn(executable, [command, ...args], {
      cwd: projectDir,
      env: createPnpmChildEnv(),
      stdio: "inherit",
      shell: false,
    });

    child.once("error", (error) => {
      reject(new Error(`Failed to start pnpm: ${error.message}`));
    });

    child.once("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

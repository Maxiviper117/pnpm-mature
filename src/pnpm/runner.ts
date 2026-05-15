import { spawn } from "node:child_process";

export async function runPnpmCommand(
  projectDir: string,
  command: "update" | "install",
  args: string[] = [],
): Promise<number> {
  const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  return await new Promise<number>((resolve, reject) => {
    const child = spawn(executable, [command, ...args], {
      cwd: projectDir,
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

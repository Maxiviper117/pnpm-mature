import { spawn } from "node:child_process";

export async function runPnpmCommand(
  projectDir: string,
  command: "update" | "install",
  args: string[] = [],
): Promise<number> {
  const useShell = process.platform === "win32";
  const executable = useShell ? "pnpm" : "pnpm";

  return await new Promise<number>((resolve, reject) => {
    const child = spawn(executable, [command, ...args], {
      cwd: projectDir,
      stdio: "inherit",
      shell: useShell,
    });

    child.once("error", (error) => {
      reject(new Error(`Failed to start pnpm: ${error.message}`));
    });

    child.once("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

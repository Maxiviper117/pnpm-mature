import type { CommandOptions } from "../types";
import { runMatureCommand } from "./run";

export async function runInstallCommand(options: CommandOptions): Promise<number> {
  return await runMatureCommand("install", options);
}

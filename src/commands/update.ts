import type { CommandOptions } from "../types";
import { runMatureCommand } from "./run";

export async function runUpdateCommand(options: CommandOptions): Promise<number> {
  return await runMatureCommand("update", options);
}

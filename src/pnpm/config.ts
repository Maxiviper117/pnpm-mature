import { spawn } from "node:child_process";

import type { CommandOptions } from "../types";
import { createPnpmChildEnv } from "./env";

export type PnpmConfigReader = (key: string) => Promise<string | undefined>;

const MINUTES_PER_DAY = 24 * 60;

export async function resolveMinimumAgeMinutes(
  options: CommandOptions,
  readConfigValue: PnpmConfigReader = readPnpmGlobalConfigValue,
): Promise<number> {
  if (options.age !== undefined) {
    return options.age * MINUTES_PER_DAY;
  }

  if (!options.usePnpmGlobalConfig) {
    throw new Error("Provide --age <days> or --use-pnpm-global-config");
  }

  const configuredValue = await readConfigValue("minimumReleaseAge");
  const configuredAgeMinutes = parseMinimumReleaseAgeMinutes(configuredValue);

  if (configuredAgeMinutes === undefined) {
    throw new Error(
      "pnpm global config minimumReleaseAge is not set to a positive integer number of minutes",
    );
  }

  return configuredAgeMinutes;
}

export function parseMinimumReleaseAgeMinutes(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (normalizedValue === "" || normalizedValue === "undefined" || normalizedValue === "null") {
    return undefined;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

export function formatMinimumAgeShortLabel(minimumAgeMinutes: number): string {
  if (minimumAgeMinutes % MINUTES_PER_DAY === 0) {
    return `${minimumAgeMinutes / MINUTES_PER_DAY}d`;
  }

  return `${minimumAgeMinutes}m`;
}

export function formatMinimumAgeLongLabel(minimumAgeMinutes: number): string {
  if (minimumAgeMinutes % MINUTES_PER_DAY === 0) {
    const days = minimumAgeMinutes / MINUTES_PER_DAY;
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  return `${minimumAgeMinutes} minute${minimumAgeMinutes === 1 ? "" : "s"}`;
}

async function readPnpmGlobalConfigValue(key: string): Promise<string | undefined> {
  const executable = "pnpm";
  const args = ["config", "get", key, "--global"];

  return await new Promise<string | undefined>((resolve, reject) => {
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    const child = spawn(executable, args, {
      env: createPnpmChildEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderrChunks.push(chunk);
    });

    child.once("error", (error) => {
      reject(new Error(`Failed to read pnpm global config: ${error.message}`));
    });

    child.once("close", (code) => {
      if (code !== 0) {
        const stderr = stderrChunks.join("").trim();
        reject(new Error(stderr || `Failed to read pnpm global config ${key} (exit code ${code})`));
        return;
      }

      const output = stdoutChunks.join("").trim();
      resolve(output === "" || output === "undefined" || output === "null" ? undefined : output);
    });
  });
}

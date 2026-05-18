const UNSAFE_PNPM_ENV_KEYS = new Set(["NODE_OPTIONS", "NODE_PATH", "BUN_OPTIONS"]);

export function createPnpmChildEnv(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  for (const [key, value] of Object.entries(source)) {
    if (UNSAFE_PNPM_ENV_KEYS.has(key)) {
      continue;
    }

    env[key] = value;
  }

  return env;
}

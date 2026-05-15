# How It Works

`pnpm-mature` does not implement a package manager. It computes version ceilings and hands the final resolution back to pnpm.

The high-level flow is:

1. Read direct dependency ranges from `package.json`.
2. Fetch package metadata from the npm registry.
3. Filter versions by semver compatibility and minimum release age.
4. Generate temporary `pnpm.overrides` entries.
5. Run `pnpm update` or `pnpm install`.
6. Restore the original `package.json` after completion.

That design keeps peer dependency handling, lockfile generation, deduplication, and overrides behavior inside pnpm where they belong.
# How It Works

`pnpm-mature` does not implement a package manager. It computes version ceilings and hands the final resolution back to pnpm.

The high-level flow is:

1. Read direct dependency ranges from `package.json`.
2. Fetch package metadata from the npm registry.
3. Filter versions by semver compatibility and minimum release age.
4. Rewrite the targeted direct dependency versions in `package.json`.
5. Run `pnpm update` or `pnpm install`.
6. Keep the rewritten `package.json` on success, or restore the original file if the run fails.

That design keeps peer dependency handling, lockfile generation, and deduplication inside pnpm while making the selected direct dependency versions explicit in `package.json`.
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

## Relaxing constraints

By default, exact pinned specs such as `1.2.3` remain exact, and semver ranges such as `^25.8.0` or `~1.2.3` keep their normal semver compatibility rules. No relaxation is applied.

`--relax` (short `-r`) applies the same widening to both exact pinned versions and semver ranges before selection:

- `--relax minor` treats the spec as compatible with versions below the next major (`* <major+1.0.0`).
- `--relax major` and `--relax all` treat the spec as compatible with any version (`*`).
- `--relax` with no value defaults to `all`.

This applies uniformly regardless of whether the declared spec is a pin or a range.

## Registry response limit

`pnpm-mature` reads full npm registry packuments because publish timestamps are required for age-based selection. Those responses are streamed and capped to avoid unbounded memory use if a registry, proxy, or network response is unexpectedly large.

The default npm registry response limit is 100 MiB per package. If a legitimate package exceeds that limit, the error names the package and suggests rerunning with a higher cap:

```bash
pnpm-mature update --age 7 --max-registry-mib 256
```

Only raise this value when the failing package is expected and you trust the registry source.

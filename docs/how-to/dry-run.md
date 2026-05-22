# Run a Dry Run

Use `--dry-run` to inspect what `pnpm-mature` would select before changing dependencies.

```bash
pnpm-mature update --age 7 --dry-run
```

The output shows:

- the declared dependency range
- the latest registry version
- the selected mature version
- skipped versions that are still too new

If no compatible version is old enough, the command exits non-zero so you can block unsafe updates in automation.

## Preview constraint relaxation

Exact pinned dependencies and semver ranges stay strict unless you relax constraints with `--relax`. Use dry runs to inspect what would happen:

```bash
pnpm-mature update --age 7 --dry-run --relax minor
pnpm-mature update --age 7 --dry-run --relax
```

`--relax minor` removes the lower bound while staying below the next major. A bare `--relax` defaults to `all`, which removes all bounds. The flag applies uniformly to both pinned versions and semver ranges.

## Large registry responses

Dry runs still fetch npm registry metadata. If a package has a very large registry response, pnpm-mature stops at the configured safety limit and prints the package name.

For legitimate packages, rerun with a higher response cap:

```bash
pnpm-mature update --age 7 --dry-run --max-registry-mib 256
```

The default limit is 100 MiB per package.

## Related

- [Write Versions Without Running pnpm](/how-to/write-only) — apply the changes to `package.json` and stop.

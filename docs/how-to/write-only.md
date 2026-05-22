# Write Versions Without Running pnpm

Use `--write-only` to update `package.json` with maturity-aware versions and exit without delegating to pnpm.

```bash
pnpm-mature update --age 7 --write-only
pnpm-mature install --age 7 --write-only
```

The command inspects each supported direct dependency, selects the newest semver-compatible version older than the configured age threshold, rewrites those entries in `package.json`, and exits. No confirmation prompt is shown and `pnpm update`/`pnpm install` is not invoked.

You can also choose write-only mode at the interactive prompt without the flag. When running `pnpm-mature update` interactively, pressing `w` at the prompt writes `package.json` and skips pnpm:

```txt
[w] write-only  [y] write + update  [N] cancel
```

## Why use `--write-only`

- **Review and tweak:** Inspect the rewritten `package.json` before running pnpm yourself.
- **Staging updates:** Write mature versions as part of a CI step without triggering a full install.
- **Manual control:** You may prefer to run `pnpm install` separately with your own flags.

## Preview before writing

Always preview selections with `--dry-run` first:

```bash
pnpm-mature update --age 7 --dry-run
pnpm-mature update --age 7 --write-only
```

## Combine with other flags

`--write-only` works with all other options including `--relax`, `--age`, and targeted package names:

```bash
pnpm-mature update react vitest --age 30 --relax minor --write-only
```

After writing, run pnpm yourself to apply the changes:

```bash
pnpm install
```

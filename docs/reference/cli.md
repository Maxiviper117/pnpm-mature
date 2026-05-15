# CLI

## update

```bash
pnpm-mature update [package...] [-a|--age <days>] [-g|--use-pnpm-global-config] [-d|--dry-run]
```

Computes maturity-aware versions, writes them into `package.json`, and runs `pnpm update`. When one or more package names are supplied, only those supported direct dependencies are processed.

## install

```bash
pnpm-mature install [package...] [-a|--age <days>] [-g|--use-pnpm-global-config] [-d|--dry-run]
```

Uses the same maturity flow, writes the selected versions into `package.json`, and then delegates to `pnpm install`. When one or more package names are supplied, only those supported direct dependencies are processed.

## Options

- `[package...]`: Optional direct dependency names to target. Every requested package must already exist in `package.json` with a supported dependency spec.
- `-a, --age <days>`: Positive integer threshold in days. Overrides config if both are provided.
- `-g, --use-pnpm-global-config`: Read `minimumReleaseAge` from pnpm global config when `--age` is omitted. pnpm stores this value in minutes.
- `-p, --ignore-pinned [minor|major|all]`: Widen exact pinned versions. `minor` allows mature updates within the same major. `major` and `all` allow mature updates across major versions. If you pass `-p` with no value, it defaults to `all`.
- `-d, --dry-run`: Print selections and generated `package.json` updates without running pnpm.
- `-t, --include-transitive`: Reserved for a future release and currently rejected.
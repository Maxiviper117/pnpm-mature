# CLI

## update

```bash
pnpm-mature update [-a|--age <days>] [-g|--use-pnpm-global-config] [-d|--dry-run]
```

Computes maturity-aware version caps, injects temporary `pnpm.overrides`, and runs `pnpm update`.

## install

```bash
pnpm-mature install [-a|--age <days>] [-g|--use-pnpm-global-config] [-d|--dry-run]
```

Uses the same maturity flow, then delegates to `pnpm install`.

## Options

- `-a, --age <days>`: Positive integer threshold in days. Overrides config if both are provided.
- `-g, --use-pnpm-global-config`: Read `minimumReleaseAge` from pnpm global config when `--age` is omitted. pnpm stores this value in minutes.
- `-p, --ignore-pinned [minor|major|all]`: Widen exact pinned versions. `minor` allows mature updates within the same major. `major` and `all` allow mature updates across major versions. If you pass `-p` with no value, it defaults to `all`.
- `-d, --dry-run`: Print selections and generated constraints without running pnpm.
- `-t, --include-transitive`: Reserved for a future release and currently rejected.
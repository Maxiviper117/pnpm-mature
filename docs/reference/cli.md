# CLI

## update

```bash
pnpm-mature update [package...] [-a|--age <days>] [-g|--use-pnpm-global-config] [-r [level]] [-d|--dry-run] [-y|--yes] [-w|--write-only] [--max-registry-mib <mib>]
```

Computes maturity-aware versions, prints the generated `package.json` updates, asks for confirmation in interactive terminals, writes confirmed changes into `package.json`, and runs `pnpm update`. When one or more package names are supplied, only those supported direct dependencies are processed, so `pnpm-mature update react --age 7` updates just `react`.

## install

```bash
pnpm-mature install [package...] [-a|--age <days>] [-g|--use-pnpm-global-config] [-r [level]] [-d|--dry-run] [-w|--write-only] [--max-registry-mib <mib>]
```

Uses the same maturity flow, writes the selected versions into `package.json`, and then delegates to `pnpm install`. When one or more package names are supplied, only those supported direct dependencies are processed.

## Options

- `[package...]`: Optional direct dependency names to target. Every requested package must already exist in `package.json` with a supported dependency spec. For example, `pnpm-mature update react --age 7` rewrites only the `react` entry in `package.json`.
- `-a, --age <days>`: Positive integer threshold in days, up to `3650`. Overrides config if both are provided.
- `-g, --use-pnpm-global-config`: Read `minimumReleaseAge` from pnpm global config when `--age` is omitted. pnpm stores this value in minutes, and the resolved threshold must not exceed `3650` days.
- `-r, --relax [minor|major|all]`: Relax declared version constraints so mature updates can move within the same major or across majors. Applies to both exact pinned versions (like `"4.18.2"`) and semver ranges (`^25.8.0`, `~1.2.3`). `minor` removes the lower bound while staying below the next major (`* <major+1.0.0`). `major` and `all` remove all bounds (`*`), allowing selection from any version including older majors. Pass `-r` with no value to default to `all`.
- `-d, --dry-run`: Print selections and generated `package.json` updates without running pnpm.
- `-y, --yes`: Skip the interactive `update` confirmation prompt.
- `-w, --write-only`: Write mature versions to `package.json` and exit without running pnpm. The confirmation prompt is also skipped. Use `-d`/`--dry-run` first to preview the changes.
- `-t, --include-transitive`: Reserved for a future release and currently rejected.

::: warning

pnpm-mature currently only processes direct dependencies. Transitive (nested) dependencies discovered through the lockfile are not inspected or age-filtered. The `--include-transitive` flag exists as a placeholder and will be rejected if used.
:::
- `--max-registry-mib <mib>`: Override the maximum npm registry response size in MiB. The default is `100`. Use this only if pnpm-mature reports that a legitimate package exceeded the safety limit.
- `--registry-max-response-mib <mib>`: Longer alias for `--max-registry-mib`.

## Confirmation

In an interactive terminal, `update` presents a three-way prompt after printing the generated manifest updates:

```txt
[w] write-only  [y] write + update  [N] cancel
```

- `w` — write mature versions to `package.json` and exit without running pnpm.
- `y` or `yes` — write versions to `package.json` and run `pnpm update`.
- `N` or anything else — cancel before `package.json` is changed.

Pass `-y` or `--yes` to skip the prompt and run the full write + update. Non-interactive runs also skip the prompt.

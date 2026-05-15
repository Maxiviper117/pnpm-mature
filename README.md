# pnpm-mature

`pnpm-mature` is a lightweight CLI wrapper around pnpm that constrains dependency updates by package release age, while still delegating dependency resolution and lockfile generation to pnpm.

## Current MVP

Version `0.1.0` supports:

- `pnpm-mature update -a <days>`
- `pnpm-mature install -a <days>`
- `-g, --use-pnpm-global-config` to read `minimumReleaseAge` from global pnpm config when `--age` is omitted
	- pnpm stores `minimumReleaseAge` in minutes, and pnpm-mature now honors that value directly
- `-p, --ignore-pinned [minor|major|all]` to widen exact pinned versions while still enforcing the maturity threshold
	- `minor` stays within the current major
	- `major` and `all` allow mature updates across major versions
	- passing `-p` with no value defaults to `all`
- `-d, --dry-run`
- direct dependency discovery from `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`
- semver-compatible version selection using npm registry metadata
- temporary `pnpm.overrides` injection with automatic restoration

Not yet supported:

- transitive maturity constraints
- workspaces and monorepos
- git, file, link, workspace, catalog, and URL dependency specs

## Development

Install dependencies:

```bash
bun install
```

Run the CLI locally:

```bash
bun run dev -- update --age 7 --dry-run

# shorthand form
bun run dev -- update -a 7 -d
```

Typecheck:

```bash
bun run check
```

Run tests:

```bash
bun run test
```

Build the distributable CLI:

```bash
bun run build
```

## Examples

```bash
pnpm-mature update --age 7
pnpm-mature update -a 7
pnpm-mature install --age 14
pnpm-mature update -a 7 -d
pnpm-mature update -g -d
pnpm-mature update -a 7 -p minor -d
pnpm-mature update -a 7 -p -d
```

Example dry-run output:

```txt
vite
	declared: ^7.0.0
	latest: 7.2.0 (2026-05-13)
	selected: 7.1.8 (2026-05-03)
	skipped recent: 7.2.0
```

## Publishing

The package is configured to publish the built CLI from `dist/cli.js`.

```bash
bun run build
npm pack
npm publish --access public
```

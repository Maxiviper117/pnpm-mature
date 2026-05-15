# pnpm-mature

![pnpm-mature banner](assets/readme-banner.png)

[![npm version](https://img.shields.io/npm/v/@maxiviper117/pnpm-mature?logo=npm&label=npm)](https://www.npmjs.com/package/@maxiviper117/pnpm-mature)
[![CI](https://img.shields.io/github/actions/workflow/status/Maxiviper117/pnpm-mature/ci.yml?branch=main&label=ci&logo=github)](https://github.com/Maxiviper117/pnpm-mature/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/github/actions/workflow/status/Maxiviper117/pnpm-mature/deploy-docs.yml?branch=main&label=docs&logo=github)](https://github.com/Maxiviper117/pnpm-mature/actions/workflows/deploy-docs.yml)
[![License](https://img.shields.io/github/license/Maxiviper117/pnpm-mature?label=license)](./LICENSE)

`pnpm-mature` is a lightweight CLI wrapper around pnpm that constrains dependency updates by package release age, writes the selected direct dependency versions into `package.json`, and then delegates dependency resolution and lockfile generation to pnpm.

Documentation: https://maxiviper117.github.io/pnpm-mature/

## Current MVP

Version `0.1.0` supports:

- `pnpm-mature update [package...] -a <days>`
- `pnpm-mature install [package...] -a <days>`
- `-g, --use-pnpm-global-config` to read `minimumReleaseAge` from global pnpm config when `--age` is omitted
	- pnpm stores `minimumReleaseAge` in minutes, and pnpm-mature now honors that value directly
- `-p, --ignore-pinned [minor|major|all]` to widen exact pinned versions while still enforcing the maturity threshold
	- `minor` stays within the current major
	- `major` and `all` allow mature updates across major versions
	- passing `-p` with no value defaults to `all`
- `-d, --dry-run`
- optional direct dependency targeting by package name, for example `pnpm-mature update react -a 7`, which rewrites only the `react` entry in `package.json`
- single-package targeting leaves the rest of `package.json` untouched while still letting pnpm update the selected dependency
- direct dependency discovery from `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`
- semver-compatible version selection using npm registry metadata
- package.json version rewrites that persist after successful runs

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
bun run dev -- update react --age 7 --dry-run

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
pnpm-mature update react --age 7
pnpm-mature update -a 7
pnpm-mature install --age 14
pnpm-mature install react --age 14
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

## Docs

Documentation is available at https://maxiviper117.github.io/pnpm-mature/

## Publishing

The package is configured to publish the built CLI from `dist/cli.js`.

```bash
bun run build
npm pack
npm publish --access public
```

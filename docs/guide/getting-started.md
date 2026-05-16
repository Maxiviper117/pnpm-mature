# Getting Started

## Install

```bash
npm install -g @maxiviper117/pnpm-mature
```

Or run locally during development:

```bash
bun install
bun run build
node dist/cli.js update --age 7 --dry-run
node dist/cli.js update react --age 7 --dry-run
```

## First run

Preview the selected versions first:

```bash
pnpm-mature update --age 7 --dry-run
pnpm-mature update react --age 7 --dry-run
```

Then apply the constrained update:

```bash
pnpm-mature update --age 7
```

Use install mode when you want the same maturity rules during a normal install:

```bash
pnpm-mature install --age 7
```

Target a single supported direct dependency when you do not want to inspect or update the full manifest:

```bash
pnpm-mature update react --age 7
```

## Exact pinned versions

Exact pinned dependencies such as `1.2.3` stay pinned by default, so pnpm-mature only selects that exact version if it is old enough.

Use `--ignore-pinned` when you want exact pins to move to newer mature releases:

```bash
pnpm-mature update --age 7 --ignore-pinned minor --dry-run
pnpm-mature update --age 7 --ignore-pinned major --dry-run
pnpm-mature update --age 7 --ignore-pinned --dry-run
```

`minor` allows newer mature versions within the same major. `major` and `all` allow newer mature major versions too. Passing `--ignore-pinned` without a value defaults to `all`.

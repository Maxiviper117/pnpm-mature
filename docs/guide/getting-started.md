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

## Relaxing constraints

Exact pinned dependencies such as `1.2.3` stay pinned by default, and semver ranges such as `^25.8.0` or `~1.2.3` stay within their declared range by default.

Use `--relax` (short `-r`) to widen all constraints so mature updates can move freely:

```bash
pnpm-mature update --age 7 --relax minor --dry-run
pnpm-mature update --age 7 --relax major --dry-run
pnpm-mature update --age 7 --relax --dry-run
```

`minor` removes the lower bound while staying below the next major (`* <major+1.0.0`). `major` and `all` remove all bounds (`*`), allowing selection from any version including older majors. Passing `--relax` without a value defaults to `all`.

The same flag applies to both exact pinned versions and semver ranges.

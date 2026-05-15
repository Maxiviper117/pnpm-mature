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
```

## First run

Preview the selected versions first:

```bash
pnpm-mature update --age 7 --dry-run
```

Then apply the constrained update:

```bash
pnpm-mature update --age 7
```

Use install mode when you want the same maturity rules during a normal install:

```bash
pnpm-mature install --age 7
```
# Guide

## The Problem

Package registries like npm are effectively append-only in practice. While npm can yank versions with confirmed security issues, the response is reactive  -  there is always a window between publish and removal where a standard `pnpm update` would select the malicious version without hesitation. Updating to the immediate latest version means every attacker needs is one successful publish to infect every project that runs `pnpm update` in that window.

**Example: the `eslint` typosquat attack**

An attacker publishes `eslint` (one character off from the real `eslint`) to npm. Even if you depend on `eslint`, `pnpm update` cannot distinguish between a legitimate version published 6 months ago and a malicious copy published 6 minutes ago  -  it picks the newest semver-compatible version regardless of publish date.

The same blind spot applies to real packages. A compromised maintainer account can push a malicious patch to an otherwise trusted dependency, and `pnpm update` would select it immediately.

## Why pnpm Alone Isn't Enough

pnpm has no built-in mechanism to say *"only update to versions published before date X"*. Standard update commands always aim for the latest matching version, which means:

- You cannot wait N days for the community to discover and report malicious releases.
- You cannot skip versions published during a known incident window.
- You cannot enforce a cool-down period between publish and adoption without external tooling.

pnpm does offer a `minimumReleaseAge` setting in its config, but it works reactively at install time  -  it blocks resolution when a package version is too young, causing installs to fail instead of automatically falling back to an older mature version. That makes it impractical as a daily-driver policy; it is better suited as a safety net than a proactive version-selection strategy.

## What pnpm-mature Does

`pnpm-mature` wraps `pnpm install` and `pnpm update` with an **maturity filter** that enforces a minimum age for every selected version.

**Workflow:**

1. Reads direct dependencies from `package.json`
2. Fetches full publish history from the npm registry
3. Filters out every version younger than your threshold (e.g. `--age 7` = at least 7 days old)
4. Selects the newest version that passes the filter
5. Writes the selected versions into `package.json`
6. Delegates resolution to pnpm

**Example:**

```bash
pnpm-mature update --age 14
```

This updates every supported direct dependency to the newest version published **at least 14 days ago**. If a malicious `eslint` patch was published 3 days ago, it is skipped. If a stable release was published 6 months ago, it is selected.

To update a single package, pass its name:

```bash
pnpm-mature update react --age 7
```

In that mode, only the `react` entry in `package.json` is rewritten. All other dependencies are left at their current versions.

::: warning Transitive dependencies not supported

pnpm-mature only processes direct dependencies from `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`. It does not traverse or age-filter transitive (nested) dependencies. The `--include-transitive` flag is reserved for future work.

This means a compromised transitive dependency pulled in by one of your direct deps is not protected by pnpm-mature. Mitigate this with tools like `npm audit`, `pnpm audit`, or SCA scanners that operate on the resolved lockfile.
:::

- Use [Getting Started](/guide/getting-started) to try it now.
- Use [Reference](/reference/) for command details.
- Use [Explanation](/explanation/) for design rationale.
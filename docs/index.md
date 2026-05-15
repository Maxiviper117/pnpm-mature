---
layout: home
title: pnpm-mature
description: Age-constrained dependency updates for pnpm.
hero:
  name: pnpm-mature
  text: Update dependencies only after they have aged.
  tagline: Compute maturity caps from npm publish dates, then let pnpm resolve everything normally.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Reference
      link: /reference/
features:
  - title: Preserve pnpm behavior
    details: pnpm-mature does not replace pnpm's resolver, lockfile generation, or peer dependency handling.
  - title: Age-aware updates
    details: Select the newest semver-compatible version older than your configured age threshold.
  - title: Persistent manifest updates
    details: Write the selected direct dependency versions into package.json, then let pnpm resolve and lock them.
  - title: Dry-run first
    details: Inspect selected versions, skipped recent releases, and generated constraints before changing anything.
---

## Start here

1. [Guide](/guide/)
2. [How-to](/how-to/)
3. [Reference](/reference/)
4. [Explanation](/explanation/)

## Quick links

- [Getting Started](/guide/getting-started)
- [Run a Dry Run](/how-to/dry-run)
- [CLI Reference](/reference/cli)
- [How It Works](/explanation/how-it-works)
- [Contributing](/development/contributing)
# Guide

`pnpm-mature` wraps `pnpm install` and `pnpm update` with an extra maturity filter.

It reads direct dependencies from your `package.json`, fetches npm registry metadata, selects the newest version older than your threshold, injects temporary `pnpm.overrides`, and then delegates resolution back to pnpm.

- Use this section to get started quickly.
- Use [Reference](/reference/) for command details.
- Use [Explanation](/explanation/) for design rationale.
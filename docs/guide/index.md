# Guide

`pnpm-mature` wraps `pnpm install` and `pnpm update` with an extra maturity filter.

It reads direct dependencies from your `package.json`, fetches npm registry metadata, selects the newest version older than your threshold, writes those versions back into `package.json`, and then delegates resolution back to pnpm.

To update a single package, pass its name after the command, for example `pnpm-mature update react --age 7`. In that mode, pnpm-mature rewrites only the targeted direct dependency entry in `package.json`.

- Use this section to get started quickly.
- Use [Reference](/reference/) for command details.
- Use [Explanation](/explanation/) for design rationale.
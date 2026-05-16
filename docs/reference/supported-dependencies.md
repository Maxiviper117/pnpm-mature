# Supported Dependencies

The MVP currently inspects these direct dependency groups:

- `dependencies`
- `devDependencies`
- `optionalDependencies`
- `peerDependencies`

The MVP currently skips these dependency spec types:

- `git:`
- `file:`
- `link:`
- `workspace:`
- `catalog:`
- URL-based dependencies

Transitive dependency constraints and workspace-aware resolution are planned but not yet implemented.

Exact pinned versions such as `1.2.3` are supported by default as exact matches. When you pass `--ignore-pinned minor`, pnpm-mature widens exact pins to newer mature versions within the same major. When you pass `--ignore-pinned major`, `--ignore-pinned all`, or a bare `--ignore-pinned`, pnpm-mature allows newer mature versions across majors. Existing semver ranges stay unchanged.

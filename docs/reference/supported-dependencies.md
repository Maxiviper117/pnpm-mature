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

Exact pinned versions such as `1.2.3` are supported by default as exact matches. When you pass `--ignore-pinned minor` or `--ignore-pinned major`, pnpm-mature widens only those exact pins while leaving existing semver ranges unchanged.
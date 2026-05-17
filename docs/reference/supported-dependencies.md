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

When you pass `--relax minor`, pnpm-mature widens the constraint to versions below the next major. When you pass `--relax major`, `--relax all`, or a bare `--relax`, pnpm-mature removes all bounds, allowing selection from any version including older majors. This flag applies uniformly to both exact pinned versions and semver ranges.

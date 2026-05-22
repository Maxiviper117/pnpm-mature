# AGENTS.md

## Project

pnpm-mature is a lightweight TypeScript CLI that wraps pnpm with maturity-aware dependency selection. It inspects npm registry publish dates, chooses the newest semver-compatible version older than a configured age threshold, rewrites the targeted direct dependency versions in `package.json`, and then delegates resolution back to pnpm. The npm package is `@maxiviper117/pnpm-mature`; the CLI binary is `pnpm-mature`.

Keep this file up to date whenever project workflow, release automation, docs structure, or architectural boundaries change.

## Tooling

- Package manager: `bun`
- Runtime target: portable Node.js CLI output
- Development runtime: Bun 1.3.x
- Minimum Node.js engine: 18.17+
- Module format: native ESM
- CLI framework: Commander
- HTTP client: native `fetch`
- Terminal styling: Picocolors
- Semver logic: `semver`
- Formatter: Oxfmt
- Linter: Oxlint
- Tests: Vitest
- Docs: VitePress
- Releases: Google Release Please normal pre-1.0 releases
- TypeScript config:
  - `tsconfig.json` for editor diagnostics and no-emit typechecking across source and tests

## Commands

- Install dependencies: `bun install`
- Typecheck: `bun run check`
- Test: `bun run test`
- Test watch: `bun run test:watch`
- Format: `bun run fmt`
- Format check: `bun run fmt:check`
- Lint: `bun run lint`
- Lint fix: `bun run lint:fix`
- Build CLI: `bun run build`
- Docs dev server: `bun run docs:dev`
- Docs build: `bun run docs:build`
- Docs preview: `bun run docs:preview`
- Package dry run: `npm pack --dry-run`

Before finishing code changes, run:

```bash
bun run fmt:check
bun run test
bun run lint
bun run check
bun run build
```

If `bun run fmt:check` fails, run:

```bash
bun run fmt
bun run fmt:check
```

If your change touches docs, also run:

```bash
bun run docs:build
```

For publishing-related changes, also run:

```bash
npm pack --dry-run
```

## Releases

- CI workflow lives in `.github/workflows/ci.yml`.
- CI currently runs on both pushes and pull requests.
- Release Please config lives in `release-please-config.json`.
- Release Please manifest lives in `.release-please-manifest.json`.
- Release workflow lives in `.github/workflows/release-please.yml`.
- Docs deployment workflow lives in `.github/workflows/deploy-docs.yml`.
- Release Please is manifest-driven for the root Node package and uses the fixed component/tag format `pnpm-mature-v<version>`.
- Release publishes run to completion for a given ref; do not reintroduce `cancel-in-progress` on the release workflow unless the publish flow changes.
- `bump-minor-pre-major: true` keeps breaking changes below `1.0.0` until an intentional stable release is requested.
- Release Please creates release PRs and GitHub releases. npm staging runs automatically in CI after a Release Please release is created on `main`, and a maintainer must manually approve the staged package before it becomes publicly available.
- `RELEASE_PLEASE_TOKEN` is required. Configure it as a PAT or GitHub App token with enough permission to create and update branches, pull requests, releases, and labels so the release PR triggers normal CI instead of approval-gated `GITHUB_TOKEN` workflow runs.
- The publish job is set up for npm Trusted Publishing via GitHub Actions OIDC and stages with `npm stage publish --access public --provenance`. Keep `id-token: write` intact unless the publishing model changes.
- Configure the npm trusted publisher for `.github/workflows/release-please.yml` with `npm stage publish` permission. Stage approval still requires maintainer proof-of-presence and 2FA.
- After CI stages a release, approve it manually through `npm stage approve <stage-id>` or the npmjs.com staged packages UI. Use `npm stage list @maxiviper117/pnpm-mature` to find the stage ID when approving from the CLI.
- When ready for the first stable release, use a commit footer like `Release-As: 1.0.0`.
- Keep commits Conventional Commits-compatible so Release Please can infer versions. Examples:
  - `feat: add maturity-aware install command`
  - `fix: restore package.json after failed pnpm run`
  - `docs: expand VitePress CLI examples`
  - `chore: update AGENTS.md for docs workflow`
  - Avoid bracketed scopes in commit messages because they can interfere with Release Please parsing.

## Architecture

- `src/cli.ts` is the npm binary entrypoint and defines the Commander CLI.
- `src/commands/update.ts` and `src/commands/install.ts` are thin command adapters over the shared runner.
- `src/commands/run.ts` owns the main workflow: validate options, discover dependencies, fetch registry metadata, select mature versions, report decisions, rewrite direct dependency versions in `package.json`, delegate to pnpm, and roll back on failed runs.
- `src/package-name/normalize.ts` validates and deduplicates CLI-targeted package names before command execution.
- `src/package-json/read.ts` reads `package.json`, detects indentation, and classifies supported versus unsupported dependency specs.
- `src/registry/npm.ts` fetches npm packuments and converts them into sorted version metadata.
- `src/maturity/filter.ts` applies semver compatibility plus minimum-age selection logic.
- `src/pnpm/overrides.ts` is the only code that mutates `package.json`; it creates `.pnpm-mature.package.json.bak`, writes selected direct dependency versions into the manifest, and either commits or rolls back those changes.
- `src/pnpm/runner.ts` delegates execution to the real `pnpm` process and preserves exit codes.
- `src/utils/concurrency.ts` contains the bounded-concurrency helper for registry fetches.
- `src/types/` contains shared manifest, registry, and command option types.
- `test/` contains Vitest unit coverage for pure logic. Prefer testing maturity selection and manifest handling directly before adding broader integration coverage.
- `docs/` contains the VitePress site. Keep navigation, landing page, and reference pages aligned with the actual CLI surface.
- `workbench/` is reserved for gitignored manual test fixtures and disposable local repro projects. Do not make CI, docs, or release workflows depend on its contents.

## Safety Rules

- Keep `AGENTS.md` up to date after changes to tooling, commands, release automation, docs workflow, or architecture.
- Keep `docs/` up to date when adding, removing, or changing CLI commands or product behavior. New command flags or behavior changes must be reflected in the docs reference pages.
- Do not replace pnpm's resolver logic. pnpm-mature computes direct dependency target versions only; resolution, peer dependency handling, lockfile generation, and deduplication remain pnpm's job.
- Successful runs intentionally persist the selected direct dependency versions to `package.json`. Failed or interrupted runs should restore the original file when possible.
- Treat `.pnpm-mature.package.json.bak` as crash-recovery state. Do not commit it, rename it casually, or leave it behind after successful runs.
- Keep the implementation cross-platform. Avoid shell-specific behavior and prefer Node/Bun APIs or cross-platform child-process usage.
- Unsupported dependency specs such as `git:`, `file:`, `link:`, `workspace:`, `catalog:`, and URL-based dependencies must remain explicitly skipped unless support is intentionally added.
- `--include-transitive` is reserved for future work and should not silently start doing partial work without explicit design and tests.
- Keep generated `dist/` files out of source edits unless intentionally rebuilding package output.
- Use Oxfmt for formatting; do not introduce Prettier unless there is a specific gap that Oxfmt cannot cover.
- Keep `workbench/` gitignored and local-only. It is a convenience area for manual testing and should not become part of the published package or documented product surface.
- Keep CI installs lockfile-strict with `bun install --frozen-lockfile` unless the package manager strategy changes.

## Product Defaults

- The MVP supports `update` and `install` commands only.
- Both commands accept optional direct dependency names after the command name, for example `pnpm-mature update react --age 7`. Every requested package must already exist in `package.json` with a supported spec.
- The maturity threshold is expressed in days via `--age <days>` and must be a positive integer.
- When `--use-pnpm-global-config` is provided and `--age` is omitted, the CLI reads `minimumReleaseAge` from pnpm global config in minutes and uses that value directly.
- `--relax minor` removes the lower bound on declared version constraints while staying below the next major (`* <major+1.0.0`); `--relax major` and `--relax all` remove all bounds (`*`), allowing selection from any major including older ones. A bare `-r`/`--relax` defaults to `all`. This flag applies to both exact pinned versions (e.g., `"4.18.2"`) and semver ranges (e.g., `^25.8.0`).
- Short aliases are supported for the current flags: `-a` for `--age`, `-g` for `--use-pnpm-global-config`, `-r` for `--relax`, `-d` for `--dry-run`, `-y` for `--yes`, and `-t` for `--include-transitive`.
- `--max-registry-mib <mib>` and its longer alias `--registry-max-response-mib <mib>` override the default npm registry response safety limit of 100 MiB for legitimate large packuments.
- The current implementation only considers direct dependencies from:
  - `dependencies`
  - `devDependencies`
  - `optionalDependencies`
  - `peerDependencies`
- Dry-run mode prints declared ranges, latest versions, selected mature versions, skipped recent versions, and the `package.json` updates that would be written without running pnpm.
- If any supported dependency has no compatible version older than the configured threshold, the command exits non-zero instead of performing a partial constrained run.
- Interactive `update` runs print generated `package.json` updates and require a `y` or `yes` confirmation before rewriting `package.json`; `--yes` and non-interactive update runs proceed without prompting so automation does not hang.
- Successful commands rewrite the selected direct dependency entries in `package.json` before delegating to pnpm.
- Workspaces, monorepos, and transitive dependency constraints are planned but not yet implemented.

## Formatting

- Keep the codebase in existing TypeScript + ESM style.
- Prefer small, focused patches over broad refactors.
- Do not add extra formatting tooling unless there is a clear project decision to do so.

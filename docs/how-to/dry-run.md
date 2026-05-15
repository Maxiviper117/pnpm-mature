# Run a Dry Run

Use `--dry-run` to inspect what `pnpm-mature` would select before changing dependencies.

```bash
pnpm-mature update --age 7 --dry-run
```

The output shows:

- the declared dependency range
- the latest registry version
- the selected mature version
- skipped versions that are still too new

If no compatible version is old enough, the command exits non-zero so you can block unsafe updates in automation.
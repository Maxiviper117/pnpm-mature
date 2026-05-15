# Use with CI

You can gate dependency refresh jobs with a dry run first.

Example:

```bash
pnpm-mature update --age 7 --dry-run
pnpm-mature update --age 7
```

For release automation, keep using normal `pnpm` or `npm` publish flows. `pnpm-mature` is intended for dependency update decisions, not for packaging or release orchestration.
# Troubleshooting aptmark

Use the smallest reproducible fixture before changing production data or configuration. Run commands from the repository root.

## A copied expression is rejected

Remove whitespace inside numeric literals and supply explicit multiplication. Names other than the supported square-root function are not expressions.

## A percentage differs from a spreadsheet

Use 200 * (1 + 10%) for a ten percent increase. The token 10% alone means 0.1.

## Content checks fail after unrelated edits

Read IMPLEMENTATION_STATUS.md and replay the existing content validation. Do not regenerate seeds, change answer keys, or approve content merely to clear a failure.

## Reproduce and report

1. Record the exact command or UI action, runtime version, expected result, and actual result.
2. Run the regression command below on the same checkout and keep its first failure, not only the final summary.
3. Reduce the issue to a deterministic fixture without personal data or credentials.
4. Include the affected source path from the [feature guide](RECENT_IMPROVEMENTS.md) and whether it reproduces on a clean checkout.

```sh
npm test && npm run typecheck
```

## Recovery

Keep a copy of input data before experimenting. Revert the individual source change with Git and rerun the same fixture; a source revert does not automatically reverse browser storage, downloaded files, or external service state. Do not delete a lockfile or weaken a validation gate to make a failure disappear.

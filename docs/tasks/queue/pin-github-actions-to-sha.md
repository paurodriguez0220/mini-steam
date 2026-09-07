# Task: Pin GitHub Actions to commit SHAs

**Status:** Planned

## Goal

Remove the mutable-tag supply-chain risk from the deploy workflows.

## Context

`security.md` requires actions to be pinned to a commit SHA rather than a tag. All five
workflows currently reference mutable tags (`actions/checkout@v4`, `actions/setup-node@v3`,
`azure/login@v2`, `Azure/static-web-apps-deploy@v1`). A tag can be repointed by its owner,
so a compromised upstream reaches the deploy pipeline silently.

Not done during the 2026-09-07 cleanup because the correct SHAs must be looked up and
verified against the upstream repositories rather than guessed.

## Proposed Design

Replace each `uses:` tag with the resolved commit SHA, keeping the version in a trailing
comment. Also bump `actions/setup-node` from v3 to v4 while touching them.

```yaml
uses: actions/checkout@<sha>  # v4.2.2
```

Consider Dependabot with `package-ecosystem: github-actions` to keep the pins current.

## Acceptance Criteria

- [ ] Every `uses:` in `.github/workflows/` is pinned to a SHA
- [ ] Each pin carries a version comment
- [ ] A deploy still succeeds after pinning

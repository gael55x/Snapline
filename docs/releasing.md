# Release process

Snapline uses Changesets and publishes the six `@usesnapline/*` npm packages as
one fixed-version group. Do not publish directly from a developer worktree.

## Candidate preparation

1. Start from the latest `main` with a clean worktree.
2. Confirm the changeset describes user-visible behavior and breaking
   pre-1.0 removals.
3. Run `pnpm release:check` on Node 20 and Node 22.
4. Run `pnpm bench:performance`; commit its raw JSON and generated SVG together.
5. Complete the binary [1.0 exit checklist](release-1.0.md).
6. Let the Changesets action create the version PR with `pnpm
version-packages`; review every package version and changelog.

The release workflow is gated by repository variable `RELEASE_ENABLED=true`
and `NPM_TOKEN`. It reruns `pnpm release:check` before `pnpm release`.

## Release candidate

Publish `1.0.0-rc.1` before GA. From clean temporary projects, install the
registry package rather than workspace code and repeat:

```sh
npm i -D @usesnapline/cli@1.0.0-rc.1
npx snapline --version
npx snapline init
npx snapline scan src/example.tsx --json
npx snapline install claude
npx snapline doctor claude
npx snapline uninstall claude
```

Repeat the integration workflow for Codex and Cursor, and archive the commands,
tool versions, hook payloads, outputs, and candidate package integrity. Verify
the npm provenance/integrity display and the GitHub tag/release association.

## GA decision

Do not promote the RC because CI is green. The exact GA commit must have no
open P0/P1 finding, all exit boxes checked, current documentation, a recorded
registry-consumer smoke, and a maintainer verdict of **READY FOR 1.0**.

If any evidence is stale, cut another RC. Never edit benchmark JSON or graphs
by hand; regenerate them from raw data.

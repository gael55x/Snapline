# Snapline 1.0 exit checklist

Tag `v1.0.0` only when every box is checked against the exact candidate commit.
Narrative rationale and finding history live in the
[release-readiness audit](release-readiness-audit.md).

## Core and contracts

- [x] Identical inputs produce stable file ordering, finding ids, contracts,
      and JSON in the repository test suite.
- [x] Invalid TSX, invalid config, unsupported config versions, traversal, and
      external symlinks fail explicitly.
- [x] `ScanResult` and `RepairContract` carry `schemaVersion: 1` with a written
      additive-change policy.
- [x] Configuration contains only settings that affect behavior.
- [ ] A hand-labelled corpus reports positive, negative, and boundary outcomes
      for every rule, with no unexplained disagreements.
- [ ] A maintainer has accepted the documented unsupported syntax and rule
      boundaries for the lifetime of 1.x.

## Agent workflows

- [ ] The packed candidate passes a recorded Claude Code clean/edit/repair/
      stop/malformed/uninstall workflow.
- [ ] The same packed candidate passes the equivalent Codex workflow.
- [ ] The same packed candidate passes the equivalent Cursor workflow.
- [x] Each installer preserves unrelated hooks and each uninstaller removes
      only Snapline-owned entries.
- [x] Hook scanner and launcher failures are visible to the agent without
      deadlocking the session.
- [x] Stop handles tracked, modified, deleted, and pre-first-commit untracked
      files.

## CLI and fresh consumers

- [x] `--help`, `--version`, `init`, selected-file scan, `--changed`, JSON,
      human output, exit codes, doctor, install, and uninstall are tested.
- [x] Six local tarballs install together in a clean temporary npm consumer.
- [x] That consumer demonstrates a clean scan, a blocking drift scan, and all
      three install/doctor/uninstall paths.
- [ ] The accepted cold hook latency budget is written and the candidate meets
      it on the reference environment.
- [ ] `1.0.0-rc.1` installs from the registry into a clean project and repeats
      the packed-package smoke without workspace links.

## Security and privacy

- [x] Project-root containment covers absolute paths, traversal, and external
      symlinks for scan and fix.
- [x] Hook payload `cwd` cannot redirect Snapline outside the invocation root.
- [x] No source, tokens, prompts, or contracts are transmitted; optional hook
      logging is local and opt-in.
- [x] `pnpm audit --prod` reports no known vulnerabilities for the candidate
      lockfile (2026-07-13).
- [ ] GitHub's private vulnerability-reporting path is verified before GA.

## Packaging and release

- [x] All six public packages contain only intended `dist`, metadata, README,
      and license files.
- [x] Package names, executable, exports, declarations, Node floor, repository
      metadata, and versions are mechanically checked.
- [x] Packed artifacts contain no retired branding, fixtures, run archives, or
      historical assets.
- [x] CI and the release workflow run the same `pnpm release:check` gate.
- [ ] The final candidate passes `pnpm release:check` on Node 20 and Node 22.
- [ ] RC publication verifies npm provenance/integrity, release notes, tag, and
      changelog behavior.

## Documentation and evidence

- [x] Quick start, config, CLI, contracts, architecture, security, privacy,
      troubleshooting, contributing, and release process are documented.
- [x] Claude, Codex, and Cursor are labelled according to current evidence.
- [x] Unsupported dynamic classes and unimplemented analysis categories are
      stated plainly.
- [x] Performance raw JSON records environment, source commit, fixtures, and
      methodology; the SVG is generated from that JSON.
- [ ] Present-tense benchmark comparisons use candidate-era pinned tools, or
      the public copy is reduced to historical results with no current ranking.
- [ ] All copied commands have been rerun against the registry RC exactly as
      written.

## Release decision

- [ ] The [release-readiness audit](release-readiness-audit.md) has no open P0
      or P1 finding.
- [ ] A maintainer signs off **READY FOR 1.0** against the exact tag commit.

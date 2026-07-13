# Snapline 1.0 release-readiness audit

Audit date: 2026-07-13. Baseline: `main` at `f905510`. Audit branch:
`codex/audit-1.0-release-readiness`.

## Executive verdict

**NOT READY FOR 1.0.**

Snapline has a credible core and a clear wedge: deterministic source-level UI
drift feedback inside an agent's edit-and-finish loop. The scanner, repair
contracts, CLI, package graph, and hook adapters all work in repository and
packed-package tests. The audit also found and fixed release-blocking path
containment, stale integrations, silent failures, untrusted hook roots, and
weak package gates.

The remaining blockers are evidence blockers, not a request for more product
surface:

1. Claude, Codex, and Cursor have not each completed a recorded interactive
   test using the same packed release-candidate artifact.
2. Detection accuracy has no independently labelled false-positive and
   false-negative corpus. The agent benchmark measures end-state drift using
   Snapline's own scorer; it does not validate the scorer.
3. The published competitor runs are historical and did not record exact
   competitor versions. They cannot support current comparative claims without
   a pinned rerun or narrower copy.
4. Cold CLI startup is materially slower than the old documentation claimed:
   497 ms p50 and 821 ms p95 for a one-file scan on the audited machine.
   A maintainer must either accept that interactive budget explicitly or
   improve it before release.

Prepare an `rc.1` only after those four decisions are closed. Do not tag
`v1.0.0` now.

## What the product currently does

The shipped engine statically parses `.tsx` and `.jsx` with the TypeScript
compiler API. It finds nine classes of source-level drift: raw hex, inline
styles, arbitrary Tailwind values, raw palette colors, raw button/input/dialog/
card patterns when configured system components resolve, and likely duplicate
component files. It emits stable, versioned findings and one repair contract
per file. Error findings block an agent; warning findings add context.

The execution path is:

```text
agent edit or finish event
  -> agent adapter validates and normalizes the payload
  -> invocation root is canonicalized and treated as the project boundary
  -> PostToolUse scans edited files; Stop scans git-changed and untracked files
  -> config, component registry, tokens, and TSX AST are loaded
  -> deterministic rules emit sorted findings and stable ids
  -> core creates required and optional repair actions
  -> adapter returns the agent's native block or context response
  -> agent repairs and the next hook invocation rechecks the result
```

This matches the narrow product promise. It does not understand rendered
pixels, runtime state, fully computed class expressions, typography systems,
responsive consistency, dark-mode consistency, or arbitrary component variant
semantics. Those are unsupported, not hidden successes.

## Release-readiness matrix

| Area               | Required for 1.0                                                    | Current evidence                                                                 | Gaps                                                                       | Severity | Recommended action                                          |
| ------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| Core correctness   | Deterministic findings, stable ordering, explicit parse failures    | Unit/golden tests; static determinism gate; sorted file inputs                   | Accuracy is not independently labelled                                     | P1       | Add a hand-labelled quality corpus                          |
| Repair contracts   | Exact evidence, locations, required/optional actions, stable schema | `schemaVersion: 1`; golden agent output; packed JSON scan                        | Current live agent-followability only exists in historical runs            | P1       | Re-run a small current repair-loop matrix                   |
| Configuration      | Runtime validation and only effective settings                      | Unknown nested keys/types fail; no-op sections removed                           | Migration from pre-1.0 no-op keys must be noted                            | P1       | Keep the changeset explicit                                 |
| Claude integration | Packed install, lifecycle, recovery, uninstall, live use            | Adapter and launcher tests; package smoke                                        | No current interactive packed-artifact capture                             | P1       | Record clean, drift, malformed, and retry cases             |
| Codex integration  | Current project hooks and live use                                  | Current `PostToolUse`/`Stop` contracts; install/uninstall tests                  | Interactive verification pending                                           | P1       | Keep preview until recorded test passes                     |
| Cursor integration | Current project hooks and live use                                  | Current `postToolUse`/`stop` contracts; install/uninstall tests                  | Interactive verification pending                                           | P1       | Keep preview until recorded test passes                     |
| CLI                | Fresh install, selected files, JSON, exits, diagnostics             | Six-tarball clean install smoke; CLI integration tests                           | No quiet/verbose modes; cold startup is noticeable                         | P2       | Define an accepted hook-latency budget                      |
| Detection quality  | Positive, negative, boundary, duplicate, location tests per rule    | Rule, extractor, fixture, fixer, and report tests                                | No labelled precision/recall result; known dynamic-class blind spot        | P1       | Publish labelled fixture results, not estimates             |
| Performance        | Reproducible cold/warm/small/large/incremental data                 | Raw JSON and generated SVG for seven scenarios                                   | No cache; cold CLI p95 821 ms                                              | P1       | Accept or reduce cold-start budget before RC                |
| Reliability        | Predictable corrupt/missing/deleted/new-file behavior               | Invalid syntax/config, path, symlink, no-HEAD, malformed payload tests           | Permission, encoding, interruption, and cache-corruption matrix incomplete | P2       | Add targeted failure fixtures after the RC blockers         |
| Security/privacy   | Repository boundary, no shell injection, no silent transmission     | Canonical containment and external-symlink tests; `execFile`; local-only scanner | Dependency audit and disclosure workflow need release-day verification     | P1       | Run production dependency audit and confirm advisory intake |
| Packaging          | Correct names, exports, types, files, metadata, clean install       | Pack/inspect/install six tarballs; version sync gate; no retired branding        | No published RC consumer proof                                             | P1       | Publish and test `1.0.0-rc.1` before GA                     |
| Release automation | Same complete gate in CI and release                                | `release:check` in both CI and release workflow                                  | Provenance outcome not yet proven on a publication                         | P1       | Verify RC registry provenance and tag                       |
| Documentation      | Copy-paste workflow, precise limits, security, troubleshooting      | Full docs set and docs claim checker                                             | Live adapter captures and final RC commands still pending                  | P1       | Update only from recorded RC evidence                       |
| Benchmarks         | Raw data, environment, versions, reproducible reports               | 240 primary agent runs, slices, static gate, byte-reproducible reports           | Historical tools unpinned; current Codex/Cursor gate absent                | P1       | Rerun a small pinned matrix or narrow claims                |
| Maintainability    | Honest boundaries, focused packages, reviewable tests               | Shared canonical core; thin adapters; pure rules                                 | Public rule-extension contract is intentionally absent                     | P3       | Keep it absent until two real external consumers exist      |

## Scorecard

Scores are independent; they are not averaged.

| Category                     | Score | Reason                                                                                       |
| ---------------------------- | ----: | -------------------------------------------------------------------------------------------- |
| Core correctness             |   4/5 | Deterministic and strongly tested after audit fixes                                          |
| Repair-contract quality      |   4/5 | Precise, versioned, evidence-bearing, and machine-readable                                   |
| Claude integration           |   3/5 | Packed and contract tested; current live run not captured                                    |
| Codex integration            |   2/5 | Current hook contract exists, but production behavior is unproven                            |
| Cursor integration           |   2/5 | Current hook contract exists, but production behavior is unproven                            |
| CLI and developer experience |   3/5 | Usable and strict; no quiet/verbose modes and cold startup is noticeable                     |
| Configuration                |   4/5 | Small, validated, and limited to settings that affect behavior                               |
| Detection quality            |   3/5 | Good rule fixtures, but no labelled precision/recall corpus and several explicit blind spots |
| Reliability                  |   3/5 | Important failures are now explicit; the adversarial failure matrix is incomplete            |
| Performance                  |   3/5 | Fast core and incremental scans; cold process startup is 497 ms p50 and there is no cache    |
| Security and privacy         |   4/5 | Local-only design and tested repository boundary; release-day dependency audit remains       |
| Packaging                    |   4/5 | Six packages are packed, inspected, installed, and exercised outside the monorepo            |
| Documentation                |   3/5 | Broad and honest after this audit; live integration evidence is still missing                |
| Benchmarks                   |   2/5 | Substantial raw history, but competitor provenance is insufficient for current rankings      |
| Maintainability              |   4/5 | Thin adapters and a single core contract; little speculative infrastructure                  |
| Product differentiation      |   4/5 | The enforced in-session repair loop is distinct and immediately legible                      |

## Verified capability inventory

| Advertised capability                    | Status                   | Evidence                                                                      |
| ---------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Deterministic TSX/JSX scan               | Verified                 | Core tests, static repeat gate, packed clean/dirty scans                      |
| Nine documented source rules             | Verified                 | Rule and fixture tests; exact rule reference                                  |
| Versioned JSON scan and repair contracts | Verified                 | Contract types, runtime output, report golden tests                           |
| Conservative safe fixes                  | Partially verified       | Unit and CLI tests; not every finding is fixable by design                    |
| Claude project hooks and plugin launcher | Partially verified       | Contract/install/launcher tests; packed install; no current live capture      |
| Codex project hooks                      | Experimental             | Contract/install tests against current documented shape; no interactive proof |
| Cursor project hooks                     | Experimental             | Contract/install tests against current documented shape; no interactive proof |
| CLI fresh install and uninstall          | Verified                 | Clean temporary npm install from six local tarballs                           |
| Next.js/React/Tailwind projects          | Verified                 | Three fixture projects and packed consumer                                    |
| Custom semantic color classes            | Verified                 | Config/parser/registry and custom-theme fixture tests                         |
| Monorepo changed-file paths              | Partially verified       | Relative git-path tests; no broad workspace matrix                            |
| No-change incremental cache              | Not implemented          | Raw benchmark explicitly records no cache                                     |
| Current comparative benchmark ranking    | Documentation-only claim | Historical exact competitor versions were not recorded                        |
| Current Codex/Cursor drift reduction     | Not implemented          | No current hook-gated benchmark slice exists                                  |
| Remote telemetry or source upload        | Not implemented          | Scanner and hooks make no network calls; opt-in log is local                  |

## Material findings

| ID   | Severity | Area                  | Evidence and user impact                                                                                          | Root cause                                                                       | Action and status                                                     |
| ---- | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| F-01 | P0       | Security              | Scan/fix accepted traversal and external symlink targets; a repository command could read or modify outside files | Paths were joined without a canonical project-boundary contract                  | Fixed in `1ce583a`; regression tests cover traversal and symlinks     |
| F-02 | P0       | Integrations          | Codex/Cursor public support exceeded their actual stale wiring                                                    | Files existed without current lifecycle validation                               | Fixed in `c3b7b3a`; both remain preview pending live proof            |
| F-03 | P1       | Contracts/reliability | Invalid syntax, invalid nested config, and internal hook errors could be missed or underreported                  | Boundary validation and failure reporting were incomplete                        | Fixed in `d97cdd8`                                                    |
| F-04 | P0       | Security              | A crafted hook payload could redefine the project root                                                            | Adapters trusted payload `cwd` rather than invocation root                       | Fixed in `e3bd5ce`; canonical-root regressions added                  |
| F-05 | P1       | Hooks                 | A new git repo with no `HEAD` skipped untracked UI; missing plugin CLI was invisible to the agent                 | One failed git command discarded all paths; launcher collapsed every spawn error | Fixed in `48cfeb7`                                                    |
| F-06 | P1       | Public API            | `stack`, `fix`, and `benchmark` config keys were accepted but did not change product behavior                     | Aspirational settings leaked into the public schema                              | Fixed in `b5ba910`; removed before 1.0                                |
| F-07 | P1       | Packaging/release     | Release automation did not prove the packed consumer workflow or archived benchmark bytes                         | CI gates stopped at repository tests/build                                       | Fixed in `aee6bdf`; package and report gates added                    |
| F-08 | P1       | Packaging             | Five public packages had no package-level README                                                                  | Only the end-user CLI package was treated as a package consumer surface          | Fixed in `ad0da75`; smoke now requires README and license for all six |
| F-09 | P1       | Benchmarks            | Historical competitor runs omit exact competitor versions                                                         | Earlier runner captured help but not resolved versions                           | Open; rerun pinned modes or remove current ranking claims             |
| F-10 | P1       | Integrations          | No same-artifact live proof exists for all three agents                                                           | Contract tests were treated as integration proof                                 | Open; run and archive the RC matrix                                   |
| F-11 | P1       | Detection             | No labelled false-positive/false-negative result exists                                                           | End-state agent scoring was conflated with scorer validation                     | Open; add a labelled fixture corpus                                   |
| F-12 | P1       | Performance           | Old docs described roughly 10–30 ms while cold CLI p50 is 497 ms                                                  | Core scan time excluded process and TypeScript startup                           | Documentation fixed; explicit release budget decision remains open    |
| F-13 | P2       | Performance           | A 1,000-file no-change core rerun is not faster than the first run                                                | No scan cache exists                                                             | Defer unless real hook traces show changed-set scanning is disruptive |
| F-14 | P2       | Parser coverage       | Fully computed class names, responsive/dark consistency, and component variants can pass unanalysed               | Static extraction deliberately avoids executing code                             | Document now; add narrow rules only with labelled evidence            |
| F-15 | P2       | CLI                   | Quiet and verbose modes are absent                                                                                | Current output contract focused on human and JSON modes                          | Add after 1.0 if CI/agent users demonstrate need                      |
| F-16 | P3       | Extensibility         | No public custom-rule plugin API exists                                                                           | No demonstrated external consumers justify it                                    | Keep out of 1.0                                                       |

## Product value and wedge

The exact failure Snapline prevents is an agent completing with source that
looks acceptable but bypasses the repository's semantic tokens or preferred
components. It intervenes after an edit and again before completion, while the
agent still has context and can make the repair.

A prompt file is advisory. A class linter covers classes, not project-specific
component substitution. A visual regression tool detects rendered changes,
not token ownership. A post-hoc drift scanner reports after the edit loop.
Snapline's differentiated unit is the repair contract plus enforced retry.

The smallest compelling workflow is one file containing an arbitrary spacing
value, a palette color, and a raw button in a project with a resolvable Button.
The first hook call must return exact replacements; the agent repairs; the next
call must be clean. If that loop is not visible on first use, the product has
not demonstrated its value.

Likely uninstall causes are noisy false positives, unexplained blocking,
noticeable delay after every edit, hooks that silently stop running, and
configuration that requires repository archaeology. The remaining exit work
targets exactly those risks.

## Prioritized next steps

### Before 1.0

1. Freeze the candidate artifact and run the same clean/drift/malformed/large/
   uninstall workflow interactively in Claude, Codex, and Cursor.
2. Add a hand-labelled positive/negative/boundary corpus for all nine rules;
   publish counts and every disagreement.
3. Decide and record the hook latency budget. Optimize cold startup only if the
   measured RC exceeds it.
4. Rerun the smallest fair, pinned benchmark matrix on the candidate commit,
   or remove present-tense competitor ranking copy. Do not backfill history.
5. Run a production dependency audit, complete `release:check`, publish
   `1.0.0-rc.1`, and repeat the clean consumer smoke from the registry.
6. Update docs only from those artifacts, then make the binary exit checklist
   entirely green.

### Immediately after 1.0

1. Add dynamic-class and Tailwind v4 coverage with negative fixtures first.
2. Expand permission, encoding, interrupted-run, symlink, and large-file tests.
3. Measure real hook traces before adding caching or a daemon.
4. Add quiet/verbose modes only if usage shows the JSON/human split is
   insufficient.

### Later roadmap

1. Path-scoped rule severity.
2. More conservative mechanical fixes.
3. Additional framework or agent adapters based on demonstrated demand.
4. A public rule API only after at least two independent rule consumers exist.

## Maintainer recommendation

Do not tag `v1.0.0`. Complete one focused stabilization cycle and prepare
`1.0.0-rc.1`. The smallest set of actions that changes this verdict is:
three recorded live adapter workflows, one labelled detection-quality result,
one accepted performance budget, one reproducible current benchmark claim set,
and a registry-installed RC that passes the full release gate.

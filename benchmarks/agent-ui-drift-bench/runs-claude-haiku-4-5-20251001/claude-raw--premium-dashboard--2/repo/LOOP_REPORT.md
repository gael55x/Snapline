# Loop reports

## Loop 1 — skeleton, contracts, config

- **Changed:** workspace tooling, CI/release workflows, contracts package,
  config parser with validation, naming gate executed (npm/GitHub/domain checks;
  Snapline cleared — nearest npm collision is a dormant 2015 screenshot tool).
- **Tests:** contracts typecheck; config unit tests.
- **Risks:** none carried.
- **Next:** scanner.

## Loops 2–3 — scanner, rules, reports

- **Changed:** TS-compiler-API parser + 4 extractors, 9 rules, scorer, reports,
  repair contracts, fixer codemods, 52 unit/snapshot tests.
- **Tests:** `pnpm vitest run packages/core` green; golden agent-message snapshot.
- **Risks:** heuristic rules (dialog/card/duplicates) tuned conservative — kept
  at warn per false-positive policy. `px-7` deliberately not flagged (on-scale).
- **Next:** CLI + adapters.

## Loops 4–5 — CLI, adapters, plugin

- **Changed:** CLI with 9 commands, Claude adapter on verified official hook
  schemas, Codex (beta) + Cursor (experimental) adapters, plugin package with
  marketplace manifest, 18 adapter/CLI integration tests using captured payloads.
- **Tests:** 70 green after fixing a DTS build cast and workspace resolution
  (tsconfig paths + vitest aliases; build-before-test ordering documented).
- **Risks:** Codex hook wiring is instruction-level until Codex ships hooks —
  marked beta everywhere.
- **Next:** fixtures integration, benchmark.

## Loop 6 — fixer, doctor, fixtures

- **Changed:** three fixture apps (typecheck-verified) wired into tests;
  reuse-rate bug fixed (design-system internals no longer count against reuse);
  perf budgets asserted (<500ms changed-file, <3s stop scan; measured ~10–30ms).
- **Tests:** 76 green.
- **Risks:** fixtures vendor dependency-free shadcn-style components (no radix/cva)
  — documented as a limitation.
- **Next:** benchmark harness.

## Loop 7 — benchmark

- **Changed:** 30 prompts (no system hints), 8 modes with real competitor
  installs (@buoy-design/cli, driftguard — verified on npm), fresh-clone live
  runner with raw-artifact capture, median reports (json/md/csv), deterministic
  SVG graphs with hatched TBD bars, static CI harness with golden metrics
  (drift 171 / 29 violations on the committed drifted sample).
- **Tests:** bench smoke suite green; `pnpm bench:static` green.
- **Risks:** live agent matrix not executed (needs API budget) — all public
  numbers remain TBD by policy. Competitor CLI surfaces may change; --help is
  captured at setup per run.
- **Next:** docs + audit.

## Loop 8 — docs, audit, release prep

- **Changed:** README, 16 docs pages, competitor comparison, 7 subagents,
  docs:check CI gate, CHANGELOG, release-1.0 criteria, GitHub topics on
  gael55x/Snapline, all repo URLs canonicalized.
- **Tests:** full gate (lint, typecheck, build, 76 tests, bench:static,
  docs:check) green.
- **Risks:** 1.0 tag blocked on one criterion — the public benchmark run.
  Recommendation recorded in docs/release-1.0.md.
- **Next:** execute `pnpm bench:agent -- --all`, commit reports, tag.

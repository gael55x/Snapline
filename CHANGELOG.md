# Changelog

Package-level changelogs are managed by Changesets after the first npm
publish. This file tracks pre-release milestones.

## Unreleased (0.1.0 line)

- 1.0 release-candidate hardening: project-root containment for scan/fix and
  hook payloads; versioned scan/repair schemas; strict config and CLI input;
  current Claude, Codex, and Cursor lifecycle contracts; reversible setup;
  visible hook transport/scanner failures; no-HEAD git support; six-package
  clean-consumer smoke; reproducible performance evidence; and honest release
  gates. Codex and Cursor remain preview until live candidate verification.
- Removed accepted-but-unused `stack`, `fix`, and `benchmark` configuration
  sections before the v1 config contract freezes.

- Loop 1: pnpm workspace, TypeScript/ESLint/Prettier/Vitest/tsup/Changesets
  toolchain, CI + release workflows, `@usesnapline/contracts` (config,
  violations, repair contracts, scan/score, benchmark, hook, registry types),
  default `snapline.yml`.
- Loops 2–3: deterministic core scanner (TS compiler API), extractors
  (classNames incl. cn()/templates, JSX elements, inline styles, imports),
  9 drift rules with false-positive guards, ui-drift-score-v1 scorer,
  component reuse rate, human/agent/JSON reports, repair contracts with
  golden snapshots.
- Loop 4: `snapline` CLI — init, install, scan [--changed], score, fix --safe,
  doctor, hook, benchmark; --json everywhere it matters; exit codes for CI.
- Loop 5: Claude adapter on official hook schemas (PostToolUse block-with-
  contract, Stop gate with loop guard), idempotent settings.json install,
  Claude plugin package (.claude-plugin manifest + hooks.json + marketplace).
- Loop 6: safe fixer codemods (semantic color map, simple button/input swaps,
  inline-spacing conversion), doctor checks, three clean fixture apps wired
  into tests with performance budget assertions.
- Loop 7: agent-ui-drift-bench — 30 prompts, 8 modes (incl. real
  @buoy-design/cli and driftguard competitor setups), fresh-clone live runner,
  median-based reports, deterministic SVG graphs with TBD policy, CI static
  harness with golden metrics.
- Loop 8: docs set, competitor comparison, subagent definitions, docs:check
  CI gate, release-1.0 criteria audit, GitHub topics.

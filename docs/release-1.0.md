# Release 1.0 — criteria and status

1.0 means: a maintainer can recommend Snapline for daily Claude Code use on a
real Next.js/shadcn codebase without caveats about the core loop.

Status legend: [x] done · [ ] open

## Product

- [x] Name availability gate passed (npm scope @usesnapline free; GitHub
      gael55x/Snapline live with topics; usesnapline.dev/snapline.dev
      unregistered; no relevant AI-devtool conflict found. The bare npm name
      `snapline` is held by a dormant 2015 Chrome DevTools screenshot utility —
      unrelated category, scoped packages avoid it.)
- [x] Positioning finalized (agent UI repair hook; "Keep AI-generated UI on-system")
- [x] README clear: problem, loop, contract example, quickstart, rules, honest benchmark section
- [x] No public references to the retired internal codename (it appears only
      in assets/logo-reference, which documents that it must not ship; CI's
      docs:check enforces this)

## Core

- [x] Scanner works on real TSX (TS compiler API; fixtures + dirty samples covered by tests)
- [x] 9 rules stable with false-positive guards and severity config
- [x] Config stable (snapline.yml v1, validated, unknown keys rejected)
- [x] Repair contracts useful (exact replacements, required/recommended split, golden snapshot)
- [x] Safe fixer conservative (unambiguous mappings only; refuses spreads/dynamic/off-scale)

## Adapters

- [x] `snapline install claude` works (idempotent settings.json merge)
- [x] Claude PostToolUse works (block JSON with repair contract; warn via additionalContext)
- [x] Claude Stop works (block until severe drift fixed; stop_hook_active loop guard)
- [x] Codex adapter exists, clearly marked beta
- [x] Plugin package: official manifest at .claude-plugin/plugin.json, hooks.json
      with ${CLAUDE_PLUGIN_ROOT}, keywords metadata, silent-allow safety

## CLI

- [x] init · install claude · scan · scan --changed · score · fix --safe ·
      doctor · benchmark · benchmark graph (all covered by integration tests)

## Benchmarks

- [x] 30 prompts committed (no design-system hints, by design)
- [x] 3 fixture projects (clean baselines, enforced by CI)
- [x] 8 modes implemented: raw, project-instructions, shadcn MCP, Tailwind
      ESLint, Buoy (@buoy-design/cli), driftguard, Snapline, MCP+Snapline
- [x] Graphs generated from real JSON only; TBD placeholders otherwise
- [x] Static harness in CI (fixture baselines, golden metrics, determinism)
- [x] **Public agent-run results: ≥3 runs per mode.** Executed 2026-07-05:
      240 live `claude-sonnet-5` sessions (8 modes × 10 prompts × 3 attempts,
      0 unresolved failures) — gate 0/60 drifted vs 7–40% advisory. Plus
      cross-model (Haiku 4.5: raw 53% drifted/worst 444, gated 0/30) and
      cross-agent (Codex `gpt-5.5`: raw 61%, instruction-level Snapline 0/18;
      15 quota-failure cells recorded, retry deferred to quota reset). Raw
      data in `runs-data*/` and release archives.

## Quality

- [x] typecheck, lint, tests (76), build, bench:static, docs:check pass locally
- [x] CI runs the full gate on Node 20 + 22
- [x] Package exports valid (dist-only publishes, bin wired)
- [x] No fake benchmark numbers anywhere (enforced by graph/report TBD policy)
- [x] Docs match actual commands (scripts/check-docs.mjs in CI)

## Performance

- [x] Changed-file scan p95 < 500ms on fixtures (asserted in tests; measured ~10-30ms)
- [x] Stop scan < 3s on fixture projects (asserted in tests)
- [x] PostToolUse scans only the edited file — never a full-repo scan

## Verdict

**All criteria met — 1.0 approved for release** (2026-07-05). The benchmark
matrix ran in full with published raw data across three result sets
(Sonnet 5, Haiku 4.5, Codex/gpt-5.5), the README graph renders from real
JSON, and 0.1.0 has been validated end-to-end from the public registry,
including a real-world production install. The 1.0 changeset is staged;
`pnpm release` (or the CI release workflow) publishes it.

## Known limitations

- Benchmark scorer is built by Snapline's authors; formula and raw run data
  are published so results can be re-scored independently.
- Fixtures are typecheck-verified (tsc --noEmit), not `next build`-verified —
  they vendor dependency-free shadcn-style components.
- Dynamic classNames (`className={clsx(...)}`) are scanned only for statically
  readable string parts; fully computed classes pass through unflagged.
- Codex/Cursor enforcement is instruction-level until those agents ship
  lifecycle hooks.
- `snapline` on npm (unscoped) belongs to an unrelated dormant package; all
  installs use the @usesnapline scope.

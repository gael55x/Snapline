---
"@usesnapline/contracts": major
"@usesnapline/core": major
"@usesnapline/cli": major
"@usesnapline/claude": major
"@usesnapline/codex": major
"@usesnapline/cursor": major
---

Snapline 1.0 release-candidate hardening. Do not publish until every item in
`docs/release-1.0.md` is verified. Since 0.1.0:

- **Published benchmark results** (agent-ui-drift-bench, raw data committed +
  release archives): across 240 Claude Sonnet 5 sessions, the Snapline gate
  finished 0/60 drifted vs 7–40% for instructions, linting, shadcn MCP, Buoy,
  and driftguard. Cross-model (Haiku 4.5): raw 53% drifted, worst 444 — gated
  0/30 with 13 live blocks repaired. Historical cross-agent (Codex/gpt-5.5):
  raw 63% drifted — instruction-level Snapline 0/18 successful runs, with 15
  failed cells recorded.
- Tail-distribution reporting (drifted-run rate + worst score) and model-ID
  stamping on all reports and graphs.
- Fixes found by real-world dogfooding: hook command resolution for
  project-local installs, monorepo Stop-scan paths (`git diff --relative`),
  jsconfig.json + .jsx component resolution, large `--json` output truncation.
- Codex benchmark modes and cross-model/cross-agent harness support.
- Project-boundary enforcement, versioned public scan/repair schemas, visible
  hook failures, current Codex/Cursor hooks, reversible agent setup, strict CLI
  arguments, packed-package smoke, and reproducible archived reports.

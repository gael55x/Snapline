# Retry ledger

The retry policy ([docs/benchmark.md](../../docs/benchmark.md)) is an
**operator protocol, not automation**: an infrastructure-failed cell's run
directory is deleted and the cell re-executed once via the resumable
`run-matrix.sh` (which skips any cell with a `run.json`). Every retry is
recorded here; a retried cell's result stands whatever it says. Outcome
failures are never retried.

## 2026-07-05 — sonnet-5 primary matrix

- **Batch 1 (6 cells):** cleared during the matrix restart —
  `claude-raw--billing-settings-page--1` (agent exited 1),
  `claude-snapline--dashboard-visual-hierarchy--1`,
  `claude-snapline--onboarding-cleanup--3` (setup spawn failures under
  parallel install load), `claude-tailwind-eslint--onboarding-cleanup--1`,
  `--2` (npm/pnpm registry ETIMEDOUT),
  `claude-tailwind-eslint--dashboard-visual-hierarchy--2` (partial). Root
  cause (parallel per-cell installs) was eliminated by the template-checkout
  change in the same commit window. All 6 retries succeeded.
- **Batch 2 (3 cells):** post-matrix — `claude-raw--invoices-table--2`,
  `claude-shadcn-mcp--premium-dashboard--2`,
  `claude-tailwind-eslint--billing-settings-page--3` (transient
  `agent exited 1`). All 3 retries succeeded. Final matrix: 240/240, 0
  unresolved failures.

## 2026-07-05 — haiku-4.5 slice

- 1 cell backfilled after a worker exited early:
  `claude-snapline--empty-state--2`. Succeeded. Final: 60/60, 0 failures.

## 2026-07-05 — codex/gpt-5.5 slice

- **Batch 1 (30 cells):** all `codex-snapline` cells launched by a worker
  whose PATH lacked the Cursor-bundled codex binary failed with
  `spawnSync codex ENOENT`. Cleared and re-run once with `CODEX_BIN`
  resolution (harness fix committed). Retries produced real sessions.
- **Quota exhaustion (15 cells, NOT retried):** the OpenAI account hit its
  usage limit mid-slice ("try again at Jul 7th, 2026 10:30 AM"). Failures are
  recorded in the published report (`reports/latest-codex.md` failure
  column). Their single retry is deferred until the quota resets — retrying
  against a hard quota would only generate identical failures.
- **1 cell (`codex-raw--pricing-cards-polish--1`)** was never attempted
  before quota exhaustion (worker exited). Attempted afterward: the session
  ran (quota had headroom) and produced a real result — drift 48, recorded.
  The slice has artifacts for all 60 cells: 45 valid results, 15 failures.

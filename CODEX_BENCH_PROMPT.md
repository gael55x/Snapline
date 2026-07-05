# Codex benchmark prompt

Paste the prompt below into Codex CLI from the repository root
(https://github.com/gael55x/Snapline). It has Codex implement and run the
codex-raw / codex-snapline benchmark slice under the same integrity rules as
the published Claude matrix. Delete this file after the run.

---

You are the benchmark engineer for Snapline's agent-ui-drift-bench. Read
docs/benchmark.md and benchmarks/agent-ui-drift-bench/README.md first — the
methodology and integrity rules there are binding. Your job: add Codex as a
benchmarked agent and run the codex slice.

INTEGRITY RULES (non-negotiable, from the published methodology):
- Never fabricate or estimate a number. Every reported value must come from a
  recorded run.json produced by an actual run.
- Failures are recorded with reasons, never dropped. Infrastructure failures
  (install timeout, agent crash) get exactly ONE retry, logged; the retry's
  result stands. Outcome failures (drift produced, broken code) are results.
- No manual cleanup of agent output, no re-rolling scores, no prompt edits.
- Do not touch the primary Claude results: benchmarks/agent-ui-drift-bench/
  runs/, runs-data/, reports/latest.*, and the README results table are
  read-only for you.
- Do not change public positioning or README claims — write results to
  separate report files and STOP; a human reviews before anything is published.

STEP 1 — implement the Codex modes (small, follow existing patterns):
1. benchmarks/agent-ui-drift-bench/modes/types.ts: BenchMode.agent currently
   allows "claude"; widen to "claude" | "codex". Add a codexInvocation()
   helper. IMPORTANT: verify the exact non-interactive Codex CLI invocation
   from `codex --help` / `codex exec --help` on this machine before wiring it
   (expected shape: `codex exec --full-auto "<prompt>"` or equivalent
   sandbox/approval flags for unattended file-editing in the cwd). Record the
   verified flags in a comment. The benchmark needs: non-interactive, allowed
   to write files in the working directory, no human approval mid-run.
2. modes/codex-raw.ts: no prepare(), codex invocation (baseline).
3. modes/codex-snapline.ts: prepare() calls installSnapline(fixtureDir, repoRoot)
   from modes/shared.ts (bin wrapper) AND runs the wrapper with
   `install codex` so AGENTS.md gets the Snapline section. This mode is
   INSTRUCTION-LEVEL (Codex has no lifecycle hooks) — it measures whether
   "run snapline scan --changed and fix all errors before finishing" in
   AGENTS.md converges Codex to zero drift without a hard gate. Do not
   pretend it is a gate anywhere in output or comments.
4. runners/run-mode.ts: register both modes. runners/run-agent.ts: runs for
   codex modes must land in a segregated `runs-codex/` directory (extend the
   existing runsDirFor pattern — model override uses runs-<model>; give agent
   segregation the same treatment) and each run.json's `model` field must
   record the ACTUAL Codex model id (read it from codex config/output, e.g.
   `codex --version` + the model line; do not guess) and `agent: "codex"`.
5. run-matrix.sh: support AGENT=codex the same way MODEL is supported.
6. Run `pnpm -r typecheck` and `pnpm vitest run` — both must pass. The
   bench tests assert 8 registered Claude modes; extend, don't break.

STEP 2 — smoke (2 cells):
  benchmarks/agent-ui-drift-bench/run-matrix template must exist or be built
  (the script handles it). Run one cell each:
    pnpm bench:agent -- --mode codex-raw --prompt login-page
    pnpm bench:agent -- --mode codex-snapline --prompt login-page
  Inspect both run.json files and the codex-snapline diff: confirm the agent
  actually ran, edited files, and (snapline mode) that AGENTS.md was present
  and `snapline scan` appears in the agent transcript. If the invocation
  flags are wrong, fix and re-smoke before proceeding.

STEP 3 — the slice (60 cells):
  Same 10-prompt subset and 3 attempts as the published matrix (the subset is
  fixed inside run-matrix.sh). Run:
    AGENT=codex ./benchmarks/agent-ui-drift-bench/run-matrix.sh "codex-raw" /tmp/codex-raw.log
    AGENT=codex ./benchmarks/agent-ui-drift-bench/run-matrix.sh "codex-snapline" /tmp/codex-snapline.log
  Sequential or parallel is your call; the script skips completed cells and
  is resumable. Apply the one-logged-retry policy to infra failures at the end.

STEP 4 — report (separate files only):
    pnpm bench:report -- --runs-dir runs-codex --name latest-codex
  Then produce a short summary: per-mode drifted-run rate, worst drift score,
  median drift, median wall time, failures — plus the exact Codex CLI version
  and model id used. Curate raw artifacts into runs-data-codex/ (run.json,
  scanner.json, diff.patch, agent output, per cell) the same way runs-data/
  is organized. Commit runs-data-codex/ and reports/latest-codex.* on a
  branch named `bench-codex`; do NOT push to main, do NOT edit README.

FINISH by reporting: files changed, the verified codex invocation, smoke
findings, the summary table, anomalies (rate limits, sandbox denials,
timeouts), and anything that would make a skeptic distrust the comparison —
especially ways the codex setup might be unfairly better or worse than the
Claude setup (different sandbox permissions, different default model tier,
instruction-level vs hook-level Snapline). Honesty over favorable numbers.

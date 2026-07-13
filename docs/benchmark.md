# Benchmark: agent-ui-drift-bench

Measures UI drift in AI-generated React/Tailwind/shadcn code across agent
setups. Primary question: does Snapline's block-and-repair loop reduce drift
compared to raw agents, instructions, MCP, linting, and post-hoc drift
scanners?

## The experiment in one paragraph

We give the same coding agent (Claude Code, `claude-sonnet-5`) the same set of
UI tasks in the same fixture codebases, changing exactly one thing between
groups: which drift tooling is active. Each task runs in a pristine copy of the
repository, the agent works unattended, and when it finishes we score the
resulting code with a deterministic scanner — counting raw hex colors,
arbitrary Tailwind values, palette classes, raw primitives, and duplicate
components. Three attempts per (mode × prompt), medians reported, every raw
artifact kept. The prompts never mention design systems, tokens, or shadcn —
whether the agent stays on-system _without being reminded_ is the thing being
measured.

## Release claim status

The 2026-07-05 agent results below are real archived runs, but the historical
competitor cells did not record exact resolved package versions. Treat the
matrix as historical evidence about that run set, not a current product
ranking. The runner now pins and records versions; the pinned modes have not
yet been rerun on the 1.0 candidate. Current Codex hook and Cursor hook results
also do not exist.

Scanner and CLI latency are a separate experiment with their own raw JSON and
environment record; see [performance.md](performance.md). Do not mix agent wall
time with scanner latency.

## The exact matrix

The published results come from the **reduced matrix**:

- **8 modes** (table below) × **10 prompts** × **3 attempts** = 240 runs
- Prompts: 5 polish "drift-traps" (`premium-dashboard`,
  `polished-settings-page`, `pricing-cards-polish`, `onboarding-cleanup`,
  `dashboard-visual-hierarchy` — "make it look premium" tasks where agents
  historically reach for hex and arbitrary values) + 5 build/modal/table tasks
  (`billing-settings-page`, `login-page`, `team-invite-modal`,
  `invoices-table`, `empty-state`). The full prompt set (30) is in
  `prompts/`; the subset is fixed in `run-matrix.sh`.
- Model `claude-sonnet-5`, permission mode `acceptEdits`, same frozen lockfile
  everywhere. Runs execute in parallel workers (one mode per worker). The
  current runner records each checkout SHA; the historical archives contain
  `template-sha.txt` for 316/360 cells, so 44 missing values remain unknown.

**Cross-model and cross-agent slices.** The same harness runs against other
models via `--model` and other agents via `AGENT=codex` (cells land in
segregated `runs-<model|agent>/` directories with their own reports, never
mixed into the primary matrix). Every `run.json` records its exact model ID;
reports and graph subtitles list the model(s) they aggregate. Published
slices:

- `claude-haiku-4-5-20251001` (raw vs gated):
  [reports/latest-haiku.md](../benchmarks/agent-ui-drift-bench/reports/latest-haiku.md)
- Codex CLI / `gpt-5.5` (raw vs **instruction-level** Snapline at the time of
  execution; this historical slice predates Codex lifecycle hooks and measures
  the repair-contract format without a gate):
  [reports/latest-codex.md](../benchmarks/agent-ui-drift-bench/reports/latest-codex.md)

Reproduce: `MODEL=<id> ./run-matrix.sh "<mode>"` or
`AGENT=codex ./run-matrix.sh "codex-raw"`.

## What one run looks like

For cell `claude-buoy--premium-dashboard--2`:

1. **Pristine checkout.** A byte-identical copy-on-write copy (APFS clonefile)
   of a template checkout — cloned from the pinned commit, installed and built
   once — lands in `runs/<id>/repo`. (Without a template, the runner does a
   fresh `git clone` + frozen-lockfile install per run; either way the starting
   tree is provably identical and its SHA is stored next to the run.)
2. **Mode setup, committed.** The mode's `prepare()` runs: here, `npm install
@buoy-design/cli`, capture `buoy --help` into SETUP-NOTES.md, write a
   CLAUDE.md telling the agent to run Buoy's check before finishing. The setup
   is committed so the git diff afterward contains only the agent's work.
3. **Unattended agent session.** `claude -p "<prompt>" --model claude-sonnet-5
--permission-mode acceptEdits` in the fixture directory. Nobody intervenes;
   there is no manual cleanup and no re-rolling.
4. **Scoring.** The Snapline scanner scores the final tree (drift score,
   violation counts, component reuse rate), `tsc --noEmit` checks it still
   typechecks, and for Snapline modes the hook log records every
   PostToolUse/Stop decision with timing.
5. **Artifacts.** `run.json` (all metrics), `scanner.json`, `diff.patch`,
   agent stdout/stderr, and the hook log are stored per run.

## Failure and retry policy

Runs fail for two distinct reasons, treated differently:

- **Infrastructure failures** (registry timeout during setup, agent process
  crash/non-zero exit before producing work) are recorded with the reason,
  then granted **exactly one retry**. The retry is an operator protocol, not
  automation: the failed cell's run directory is deleted and the cell
  re-executed via the resumable `run-matrix.sh`; every retry event is recorded
  in the committed ledger,
  [`RETRIES.md`](../benchmarks/agent-ui-drift-bench/RETRIES.md). Re-running
  broken plumbing is fair; re-rolling scores is not — a retried cell's result
  stands whatever it says.
- **Outcome failures** (mode tooling installed but drift still produced, agent
  finished with broken code) are results, not failures — they score normally.

Cells that fail twice stay in the report as failures, excluded from medians
but counted in the failure column.

## Modes

| mode                        | what it tests                                            |
| --------------------------- | -------------------------------------------------------- |
| claude-raw                  | Claude Code, no guidance (baseline)                      |
| claude-project-instructions | design-system rules in CLAUDE.md                         |
| claude-shadcn-mcp           | shadcn MCP server for component discovery                |
| claude-tailwind-eslint      | eslint-plugin-tailwindcss, agent told to keep lint clean |
| claude-buoy                 | @buoy-design/cli drift check                             |
| claude-drift-guard          | driftguard compliance check                              |
| claude-snapline             | Snapline PostToolUse + Stop hooks                        |
| claude-shadcn-mcp-snapline  | shadcn MCP + Snapline                                    |

Executed additionally: `codex-raw` and `codex-snapline` using the historical
instruction-level mode described above. A current Codex hook-gated slice and a
Cursor slice have not been run. Competitor CLIs evolve; their `--help` output is
captured at setup time so each run records what was actually tested.

## Metrics

**Drift score** (`ui-drift-score-v1`, lower is better, 0 is on-system):

```
errors×5 + warnings×2 + rawHex×4 + inlineStyle×4 + arbitrary×3
+ rawPalette×2 + rawPrimitives×3 + duplicates×5
```

**Component reuse rate** (higher is better):

```
designSystemUses / (designSystemUses + rawPrimitiveUses)     (1 when no elements)
```

Design-system uses are capitalized tags matching (or prefixed by) a resolving
registry component — `CardHeader` counts toward `Card`. Raw primitive uses are
`button`, `input`, `select`, `textarea`.

Also reported per mode: total violations, typecheck pass rate, repair
iterations (hook `block` count via `SNAPLINE_HOOK_LOG`), hook runtime, wall
time, files touched.

**Medians and drift rate.** Frontier models produce zero drift on many
prompts, so mode medians can all be 0 while the modes still differ. The report
therefore shows both the **median drift score** and the **drifted-run rate**
(share of runs with any drift, with the worst score) — same raw data, no
goalpost-moving: a gate's value lives in the tail, not the median.

## Graph policy

Graphs and tables only ever contain numbers from recorded runs. Modes without
runs render as hatched **TBD** bars — values are never fabricated. Every graph
footer embeds the run count, generation timestamp, and config hash.

## Raw data

Per-run artifacts (`run.json`, `scanner.json`, `diff.patch`, agent output,
hook logs) are published with the results — committed to the repository when
size permits, otherwise attached to the GitHub release as an archive and
linked from `reports/latest.md`. Anyone can re-score every diff with their own
tooling.

**Field reports are not benchmark data.** Real-codebase evidence (e.g. hook
telemetry from Snapline's own maintainers' projects) is reported separately
and labeled as anecdote: real repos have no fixed baseline and are not
reproducible by third parties.

## Reproducing it

```sh
git clone https://github.com/gael55x/Snapline && cd Snapline
pnpm install && pnpm build
pnpm bench:static                                    # CI-safe pipeline validation, no agents
pnpm bench:agent -- --mode claude-raw --prompt login-page   # one cell
benchmarks/agent-ui-drift-bench/run-matrix.sh "claude-raw"  # one mode, full subset
pnpm bench:report                                    # aggregate new runs/
pnpm bench:report:published                          # regenerate committed reports/graphs from runs-data*/
pnpm bench:published:check                           # verify committed bytes match raw JSON
```

Requirements for live runs: the `claude` CLI authenticated, API budget
(~240 sessions for the full reduced matrix), and hours of wall time.
`run-matrix.sh` is resumable — completed cells are skipped.

`bench:static` gates CI: the three fixtures must scan clean (drift 0), the
committed drifted sample must produce exact golden metrics twice byte-identical
(determinism gate), and the report/graph pipeline must regenerate. It writes
`reports/static-validation.json` — pipeline validation, not a mode comparison.
Inside the repo, `snapline benchmark [graph]` delegates to these scripts.

## Limitations

- **The scorer is built by the Snapline authors.** Mitigation: the formula and
  weights are published above, the scanner is deterministic, and raw per-run
  data (diffs, agent output, scanner JSON) is published so anyone can re-score
  with their own tool.
- **Fixtures are typecheck-verified, not next-built.** The "build pass" gate is
  `tsc --noEmit`, which misses runtime-only breakage.
- **Agents are nondeterministic.** Three runs and medians reduce noise but do
  not eliminate it; raw artifacts allow deeper analysis.
- **Historical competitor versions were not stamped.** Help output was kept,
  but the published `run.json` files do not identify exact competitor package
  versions. Treat those comparisons as historical. New runs use exact package
  pins and record resolved versions plus the source commit and environment.
- **Coverage is narrow.** The primary matrix is Claude Code +
  `claude-sonnet-5`; Haiku and historical Codex slices cover only raw versus
  Snapline. No current hook-gated Codex or Cursor matrix exists.
- **The benchmark does not validate its own detector.** A zero scorer result
  shows convergence under this scorer. Precision and recall require a separate
  hand-labelled fixture corpus, which is still a 1.0 exit item.

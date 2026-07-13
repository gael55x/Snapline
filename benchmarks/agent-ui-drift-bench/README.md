# agent-ui-drift-bench

Measures UI drift in AI-generated React/Tailwind/shadcn code across agent
setups. Primary question: **does Snapline's block-and-repair loop reduce drift
compared to raw agents, instructions, MCP, linting, and post-hoc drift
scanners?**

## Modes

| mode                        | what it tests                                                                  |
| --------------------------- | ------------------------------------------------------------------------------ |
| claude-raw                  | Claude Code, no guidance (baseline)                                            |
| claude-project-instructions | design-system rules in CLAUDE.md                                               |
| claude-shadcn-mcp           | shadcn MCP server for component discovery                                      |
| claude-tailwind-eslint      | eslint-plugin-tailwindcss, agent told to keep lint clean                       |
| claude-buoy                 | [@buoy-design/cli](https://www.npmjs.com/package/@buoy-design/cli) drift check |
| claude-drift-guard          | [driftguard](https://www.npmjs.com/package/driftguard) compliance check        |
| claude-snapline             | Snapline PostToolUse + Stop hooks                                              |
| claude-shadcn-mcp-snapline  | shadcn MCP + Snapline                                                          |

Also executed: codex-raw and codex-snapline using the instruction-level
workflow that existed at the time. This historical slice predates Snapline's
Codex lifecycle hooks; see `reports/latest-codex.md`. No current hook-gated
Codex or Cursor slice has been run.

## Protocol

- Same prompt, same fixture, same model, same lockfile per comparison.
- Pristine checkout per run: a fresh `git clone` (default) or a byte-identical
  copy-on-write copy of a template checkout (`SNAPLINE_BENCH_TEMPLATE`, APFS
  clonefile). The current runner records its commit SHA per run. Historical
  archives contain that file for 316/360 cells; missing values are not inferred.
  Mode setup is committed
  before the agent starts.
- No manual cleanup, no cherry-picking. Minimum 3 runs per mode; medians reported.
- Raw agent output, git diffs, scanner JSON, and hook logs stored per run under `runs/`.
- Competitor setup failures are recorded with reasons, never dropped or faked.
- Scoring is Snapline's deterministic scanner (ui-drift-score-v1). Note the
  scorer is built by the Snapline authors — the formula, weights, and raw
  per-run data are all published so anyone can re-score.

## Running

```sh
pnpm bench:static                                   # CI-safe pipeline validation, no agents
pnpm bench:agent -- --mode claude-raw --prompt login-page
pnpm bench:agent -- --all                           # full matrix (needs claude CLI + API budget)
pnpm bench:report                                   # runs/ -> reports/latest.{json,md,csv}
pnpm bench:report:published                         # runs-data*/ -> committed reports + graphs
pnpm bench:published:check                          # byte-check committed artifacts against raw data
pnpm bench:graph                                    # reports/latest.json -> graphs/*.svg
```

## Outputs

- `reports/latest.json|md|csv` — aggregated medians with config hash + timestamp
- `graphs/*.svg` — deterministic bar charts; modes without runs render **TBD**
- `reports/static-validation.json` — scanner pipeline validation (not a mode comparison)

Graphs and tables only ever contain numbers from recorded runs. If you see TBD,
the run has not happened yet.

## Published raw data

- `runs-data/` (committed): per-run `run.json`, `scanner.json`, `diff.patch`,
  agent stdout/stderr, and hook logs for all 240 cells of the sonnet-5 matrix.
- Full archive incl. each run's final fixture tree: attached to the
  [0.1.0 release](https://github.com/gael55x/Snapline/releases/tag/%40usesnapline/cli%400.1.0)
  as `agent-ui-drift-bench-sonnet5-full.tar.gz`.
- `runs-data-haiku/` + `reports/latest-haiku.*`: cross-model slice,
  `claude-haiku-4-5-20251001`, raw vs gated (60 runs); full archive on the
  release as `agent-ui-drift-bench-haiku45-full.tar.gz`.
- `runs-data-codex/` + `reports/latest-codex.*`: cross-agent slice, Codex CLI
  (`gpt-5.5`), instruction-level Snapline (no hook gate exists for Codex);
  45/60 valid cells — 15 failed on account quota/timeout, recorded with
  reasons, one-retry pass deferred to quota reset. Full archive on the release
  as `agent-ui-drift-bench-codex-gpt55-full.tar.gz`.

The published historical runs did not stamp competitor package versions in
`run.json`; they are evidence for that recorded execution, not a durable
ranking of current releases. New runs pin Buoy `0.3.38`, driftguard `0.1.1`,
eslint `9.17.0` with eslint-plugin-tailwindcss `3.17.0`, and shadcn `4.13.0`,
and record Node, platform, source commit, agent version, and resolved tool
versions under `environment`.

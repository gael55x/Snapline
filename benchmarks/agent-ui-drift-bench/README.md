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

Planned: codex-raw, codex-snapline, cursor-raw, cursor-snapline (blocked on
stable hook APIs; see docs/roadmap.md).

## Protocol

- Same prompt, same fixture, same model, same lockfile per comparison.
- Pristine checkout per run: a fresh `git clone` (default) or a byte-identical
  copy-on-write copy of a template checkout (`SNAPLINE_BENCH_TEMPLATE`, APFS
  clonefile) whose commit SHA is recorded per run. Mode setup is committed
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

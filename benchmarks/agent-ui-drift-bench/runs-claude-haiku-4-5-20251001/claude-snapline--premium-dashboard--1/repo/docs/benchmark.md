# Benchmark: agent-ui-drift-bench

Measures UI drift in AI-generated React/Tailwind/shadcn code across agent
setups. Primary question: does Snapline's block-and-repair loop reduce drift
compared to raw agents, instructions, MCP, linting, and post-hoc drift
scanners?

**Current status: the harness is complete and CI-validated (static pipeline
runs on every commit). Public agent-run results are TBD — no numbers are
published yet.**

## Methodology

Per run (mode × prompt × attempt):

1. Fresh `git clone` of the repo into `runs/<runId>/repo`, `pnpm install`
   with a frozen lockfile, build.
2. Mode setup (`mode.prepare()`) is applied and **committed before the agent
   starts**, so the diff contains only the agent's work.
3. The agent CLI runs with the prompt. Same prompt, same fixture, same model
   (`claude-sonnet-5` in `benchmark.config.json`), same lockfile per
   comparison. No manual cleanup, no cherry-picking.
4. Output is scored with the Snapline scanner and typechecked; git diff, raw
   agent stdout/stderr, scanner JSON, and hook logs are stored under `runs/`.
5. Failures (agent crash, setup error) are recorded with reasons — never
   dropped or faked. Failed runs are excluded from medians but reported in the
   failure column.

Minimum 3 runs per mode; **medians only** are reported.

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

Planned: codex-raw/snapline and cursor-raw/snapline, blocked on stable hook
APIs ([codex.md](codex.md), [cursor.md](cursor.md)). Competitor CLIs evolve;
their `--help` output is captured at setup time so each run records what was
actually tested.

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

## Graph policy

Graphs and tables only ever contain numbers from recorded runs. Modes without
runs render as hatched **TBD** bars — values are never fabricated. Every graph
footer embeds the run count, generation timestamp, and config hash.

## Running it

```sh
pnpm bench:static     # CI-safe pipeline validation, no agents, no API
pnpm bench:agent -- --mode claude-raw --prompt login-page
pnpm bench:agent -- --all
pnpm bench:report     # runs/ -> reports/latest.{json,md,csv}
pnpm bench:graph      # reports/latest.json -> graphs/*.svg
```

`bench:static` gates CI: the three fixtures must scan clean (drift 0), the
committed drifted sample must produce exact golden metrics twice byte-identical
(determinism gate), and the report/graph pipeline must regenerate. It writes
`reports/static-validation.json` — pipeline validation, not a mode comparison.
Inside the repo, `snapline benchmark [graph]` delegates to these scripts.

## Limitations

- **The scorer is built by the Snapline authors.** Mitigation: the formula and
  weights are published above, the scanner is deterministic, and raw per-run
  data (diffs, agent output, scanner JSON) is committed so anyone can re-score
  with their own tool.
- **Fixtures are typecheck-verified, not next-built.** The "build pass" gate is
  `tsc --noEmit`, which misses runtime-only breakage.
- **Agents are nondeterministic.** Three runs and medians reduce noise but do
  not eliminate it; raw artifacts allow deeper analysis.
- **Competitor CLIs evolve.** Results reflect the versions pinned at run time
  (recorded per run), not the tools' best possible configuration.

<p align="center">
  <img src="https://raw.githubusercontent.com/gael55x/Snapline/main/assets/snapline-logo.png" alt="Snapline logo" width="360" />
</p>

<p align="center">
   Keep AI-generated UI on-system.
</p>

# Documentation

## 60-second setup

```sh
npm i -D @usesnapline/cli     # 1. install (always before npx snapline)
npx snapline init --claude    # 2. detect project, write snapline.yml, wire Claude hooks
npx snapline doctor claude    # 3. verify everything resolves
```

Restart your Claude Code session (hooks load at session start) — done. Your
agent now gets blocked with exact repair contracts on off-system UI and cannot
finish while errors remain. Full walkthrough with expected outputs:
[Quickstart](quickstart.md).

## Start here

| Page                            | What it covers                                             |
| ------------------------------- | ---------------------------------------------------------- |
| [Introduction](introduction.md) | What Snapline is — and explicitly is not                   |
| [Why](why.md)                   | The drift problem and why a hook beats guidance and review |
| [Quickstart](quickstart.md)     | Install, init, wire Claude hooks, first repair contract    |
| [Mental model](mental-model.md) | The loop, two gates, severity semantics, determinism       |

## Reference

| Page                                    | What it covers                                                  |
| --------------------------------------- | --------------------------------------------------------------- |
| [Architecture](architecture.md)         | Monorepo map, data flow, contracts-first design                 |
| [Hooks](hooks.md)                       | PostToolUse/Stop wiring, payloads, output contracts, loop guard |
| [Rules](rules.md)                       | All 9 rules, examples, false-positive policy                    |
| [Config](config.md)                     | Full `snapline.yml` reference                                   |
| [CLI](cli.md)                           | Commands, output modes, and exit codes                          |
| [Repair contracts](repair-contracts.md) | Contract structure and the agent-readable format                |
| [Troubleshooting](troubleshooting.md)   | Real failure modes and recovery commands                        |
| [Security](security.md)                 | Trust boundary, local data, logs, and reporting                 |
| [Performance](performance.md)           | Reproducible latency and memory measurements                    |

## Agents

| Page                     | Status                                           |
| ------------------------ | ------------------------------------------------ |
| [Claude Code](claude.md) | Supported — hooks + plugin                       |
| [Codex](codex.md)        | Preview hooks — interactive verification pending |
| [Cursor](cursor.md)      | Preview hooks — interactive verification pending |

## Project

| Page                                          | What it covers                                                    |
| --------------------------------------------- | ----------------------------------------------------------------- |
| [Benchmark](benchmark.md)                     | agent-ui-drift-bench methodology, modes, metrics, limitations     |
| [Competitors](competitors.md)                 | How Snapline relates to MCP, linting, drift scanners, review bots |
| [Roadmap](roadmap.md)                         | What's next and explicit non-goals                                |
| [Release 1.0](release-1.0.md)                 | Acceptance criteria and current status                            |
| [Readiness audit](release-readiness-audit.md) | Evidence, scorecard, findings, verdict, and next steps            |
| [Releasing](releasing.md)                     | Changesets, RC validation, publication, and GA decision           |

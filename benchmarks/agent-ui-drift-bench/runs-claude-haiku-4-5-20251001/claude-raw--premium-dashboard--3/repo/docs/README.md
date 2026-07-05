<p align="center">
  <img src="https://raw.githubusercontent.com/gael55x/Snapline/main/assets/snapline-logo.png" alt="Snapline logo" width="360" />
</p>

<p align="center">
   Keep AI-generated UI on-system.
</p>

# Documentation

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
| [Repair contracts](repair-contracts.md) | Contract structure and the agent-readable format                |

## Agents

| Page                     | Status                                                     |
| ------------------------ | ---------------------------------------------------------- |
| [Claude Code](claude.md) | Supported — hooks + plugin                                 |
| [Codex](codex.md)        | Beta — instruction-level until Codex ships lifecycle hooks |
| [Cursor](cursor.md)      | Experimental — project rules only                          |

## Project

| Page                          | What it covers                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| [Benchmark](benchmark.md)     | agent-ui-drift-bench methodology, modes, metrics, limitations     |
| [Competitors](competitors.md) | How Snapline relates to MCP, linting, drift scanners, review bots |
| [Roadmap](roadmap.md)         | What's next and explicit non-goals                                |
| [Release 1.0](release-1.0.md) | Acceptance criteria and current status                            |

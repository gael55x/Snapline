# agent-ui-drift-bench — latest report

- generated: 2026-07-05T09:23:08.375Z
- config hash: da6de300d39ed56d
- scorer: ui-drift-score-v1
- model(s): gpt-5.5
- agent(s): Codex CLI, codex exec --sandbox workspace-write -c approval_policy="never"
- total runs: 59

| mode | runs | failures | drifted runs | worst drift | drift score (median) | component reuse (median) | build pass | wall time (s) |
|---|---|---|---|---|---|---|---|---|
| claude-raw | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-project-instructions | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-shadcn-mcp | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-tailwind-eslint | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-buoy | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-drift-guard | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-snapline | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| claude-shadcn-mcp-snapline | 0 | 0 | TBD | TBD | TBD | TBD | TBD | TBD |
| codex-raw | 29 | 3 | 62% | 96 | 16.0 | 100.0% | 100% | 234 |
| codex-snapline | 30 | 12 | 0% | 0 | 0.0 | 100.0% | 100% | 248 |

TBD = no successful runs recorded for this mode yet. Values are never fabricated.

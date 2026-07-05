# agent-ui-drift-bench — latest report

- generated: 2026-07-05T05:08:20.180Z
- config hash: da6de300d39ed56d
- scorer: ui-drift-score-v1
- model(s): claude-sonnet-5
- agent: Claude Code CLI, permission mode acceptEdits
- total runs: 240

| mode | runs | failures | drifted runs | worst drift | drift score (median) | component reuse (median) | build pass | wall time (s) |
|---|---|---|---|---|---|---|---|---|
| claude-raw | 30 | 0 | 30% | 20 | 0.0 | 100.0% | 100% | 217 |
| claude-project-instructions | 30 | 0 | 7% | 10 | 0.0 | 100.0% | 97% | 171 |
| claude-shadcn-mcp | 30 | 0 | 40% | 32 | 0.0 | 100.0% | 100% | 208 |
| claude-tailwind-eslint | 30 | 0 | 17% | 8 | 0.0 | 100.0% | 100% | 255 |
| claude-buoy | 30 | 0 | 33% | 10 | 0.0 | 100.0% | 100% | 192 |
| claude-drift-guard | 30 | 0 | 40% | 48 | 0.0 | 100.0% | 100% | 239 |
| claude-snapline | 30 | 0 | 0% | 0 | 0.0 | 100.0% | 100% | 249 |
| claude-shadcn-mcp-snapline | 30 | 0 | 0% | 0 | 0.0 | 100.0% | 100% | 287 |

TBD = no successful runs recorded for this mode yet. Values are never fabricated.

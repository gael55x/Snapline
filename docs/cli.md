# CLI reference

Install the package locally, then run it through `npx snapline`. Node 20 or
newer is required.

## Commands

| Command                                | Behavior                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [--claude]`                      | Detect the project and write `snapline.yml` without overwriting an existing file. `--claude` also installs Claude hooks.                    |
| `install <claude\|codex\|cursor>`      | Merge Snapline into that agent's project hook configuration.                                                                                |
| `uninstall <claude\|codex\|cursor>`    | Remove only Snapline-owned hook entries and unchanged rule files.                                                                           |
| `scan [files...] [--changed] [--json]` | Scan the project, selected files, or the git-changed set. Explicit files and `--changed` are mutually exclusive.                            |
| `score [--json]`                       | Print the drift score without using drift as the process exit status.                                                                       |
| `fix --safe [--dry-run]`               | Apply only unambiguous mechanical fixes.                                                                                                    |
| `doctor [claude\|codex\|cursor]`       | Validate configuration and project discovery. With an agent, also require its hooks and git backstop to work.                               |
| `hook <agent> <post-tool-use\|stop>`   | Read a native hook payload from stdin and write that agent's native response to stdout. Intended for installed hooks.                       |
| `benchmark [graph]`                    | Run the repository benchmark harness. It is unavailable from a standalone npm install because fixtures and raw data live in the repository. |

Global flags are `--help`, `--version`, and `--debug`. `--json` is available
for `scan` and `score`. Unknown flags and invalid argument combinations fail
instead of being ignored.

## Exit codes

- `scan`: `0` when there are no error-severity findings; `1` when errors exist
  or the scan cannot run. Warnings alone return `0`.
- `score`: `0` after a successful scan, including when drift exists.
- `fix`, `init`, `install`, `uninstall`, `doctor`, and `benchmark`: `0` on
  success; `1` on invalid input or a blocking diagnostic.
- `hook`: `0` for valid hook invocations. Agent decisions travel in structured
  stdout JSON, not the process exit status.

Every thrown CLI failure is reported as `snapline: <reason>` followed by the
`--debug` recovery hint. Agent-hook scanner failures are returned to the agent
as visible warning context with `snapline doctor` and `snapline scan --changed`
recovery commands.

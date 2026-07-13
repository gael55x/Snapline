# Claude Code

Claude Code is Snapline's first-class agent: real lifecycle hooks, hard gates.

## Setup, option 1: CLI install

```sh
npm i -D @usesnapline/cli
npx snapline init
npx snapline install claude
```

This merges PostToolUse (`Write|Edit|MultiEdit`) and Stop hooks into
`.claude/settings.json` — exact JSON in [hooks.md](hooks.md). Idempotent, and
existing settings/hooks are left untouched. `snapline init --claude` does both
steps at once.

## Setup, option 2: plugin

```
/plugin marketplace add gael55x/Snapline
/plugin install snapline
```

The plugin ships the same two hooks (declared in `hooks/hooks.json`, resolved
via `${CLAUDE_PLUGIN_ROOT}`) plus a zero-dependency launcher that finds the
`snapline` CLI — project-local `node_modules/.bin/snapline` first, then PATH —
and forwards the hook payload. The project still needs the CLI:

```sh
npm i -D @usesnapline/cli && npx snapline init
```

## What each hook does

**PostToolUse** — fires after every `Write`/`Edit`/`MultiEdit`, scans only the
edited file. Input (subset Snapline reads):

```json
{
  "hook_event_name": "PostToolUse",
  "cwd": "/repo",
  "tool_name": "Edit",
  "tool_input": { "file_path": "/repo/src/app/page.tsx" }
}
```

Output on errors (the tool already ran; the reason is fed back so Claude
repairs before continuing):

```json
{ "decision": "block", "reason": "SNAPLINE FOUND UI DRIFT\n\nsrc/app/page.tsx\n..." }
```

Warnings only → `hookSpecificOutput.additionalContext`; clean → no output.

**Stop** — fires when Claude tries to finish; scans the git-changed set
(tracked diff against HEAD + untracked files). Input:

```json
{ "hook_event_name": "Stop", "cwd": "/repo", "stop_hook_active": false }
```

Output on errors — Claude cannot finish:

```json
{
  "decision": "block",
  "reason": "SNAPLINE FOUND UI DRIFT\n...\n\nFix the required actions above, then finish. Run \"snapline scan --changed\" to verify."
}
```

When `stop_hook_active` is `true` (a stop hook already fired for this stop),
Snapline never blocks again — the contract is surfaced as context instead. One
repair retry, no loops.

## Troubleshooting

**Hooks not firing** — run `npx snapline doctor claude`. It checks that both hooks
are present in `.claude/settings.json`, plus config validity, component
resolution, Node >= 20, and git. Claude Code loads hook settings at session
start, so restart the session after installing.

**Plugin installed but nothing happens** — if the `snapline` CLI is missing,
the plugin allows silently by design (a missing scanner must never break a
session). It prints a one-line hint to stderr, visible with `claude --debug`:

```
Snapline CLI not found. Install it with: npm i -D @usesnapline/cli (hook allowed)
```

**Blocked and unsure why** — the block reason is the full repair contract;
`npx snapline scan --changed` reproduces it in the terminal.

**Disable or remove the hooks** — run `npx snapline uninstall claude`. Snapline
removes only its PostToolUse and Stop entries and preserves unrelated Claude
settings and hooks.

## SNAPLINE_HOOK_LOG telemetry

Set `SNAPLINE_HOOK_LOG=/path/to/log.jsonl` and each hook run appends one JSON
line — `{ agent, kind, action, durationMs, files }`. Local file only, nothing
leaves the machine; unset means no logging. The
[benchmark harness](benchmark.md) uses this to count repair iterations
(`action: "block"` entries) and total hook runtime.

# Hooks

How Snapline wires into agent lifecycles and what travels across the boundary.

## Claude Code wiring

`snapline install claude` merges these entries into `.claude/settings.json`
(idempotent, never touches unrelated settings or existing hooks):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [{ "type": "command", "command": "snapline hook claude post-tool-use" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "snapline hook claude stop" }]
      }
    ]
  }
}
```

When the project has a local install (`node_modules/.bin/snapline` exists at
install time), the commands are written as `npx --no-install snapline hook ...`
instead — hook commands run in a plain shell where a project-local bin is not
on PATH. A bare `snapline` is only written for global installs.

The plugin variant ships the same two hooks in `hooks/hooks.json`, pointing at
launcher scripts via `${CLAUDE_PLUGIN_ROOT}` — see [claude.md](claude.md).

## Payload fields read

Snapline reads a small subset of the official hook payloads from stdin:

- **PostToolUse**: `tool_name` (must be `Write`, `Edit`, `MultiEdit`, or
  `NotebookEdit`), `tool_input.file_path`, `cwd`. Anything else — other tools,
  missing file path, non-JSON — is silently allowed.
- **Stop**: `cwd`, `stop_hook_active`.

Adapters normalize these into a neutral `HookEvent`; core never sees the
agent-specific field names ([architecture.md](architecture.md)).

## Output contracts

Claude decisions travel as JSON on stdout; the hook process itself always exits 0.

**PostToolUse, errors found** — the tool already ran, so `block` feeds the
reason back to Claude to repair before continuing:

```json
{ "decision": "block", "reason": "SNAPLINE FOUND UI DRIFT\n\nsrc/app/page.tsx\n..." }
```

**PostToolUse, warnings only** — non-blocking context:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "SNAPLINE FOUND UI DRIFT\n..."
  }
}
```

**Stop, errors found** — Claude cannot finish; the reason says exactly what to
repair and how to verify:

```json
{
  "decision": "block",
  "reason": "SNAPLINE FOUND UI DRIFT\n...\n\nFix the required actions above, then finish. Run \"snapline scan --changed\" to verify."
}
```

**Stop, warnings only** — same `additionalContext` shape with
`"hookEventName": "Stop"`. Clean scans produce no output at all.

## Policy

One agent-agnostic function decides ([mental-model.md](mental-model.md)):
errors block, warnings allow-with-context, clean allows silently.

Two guards make blocking safe:

- **Loop guard.** Claude sets `stop_hook_active: true` when a stop hook
  already fired for this stop. Snapline then never blocks again — the contract
  is downgraded to context. One retry, no infinite loops.
- **Never throw.** `runHook` wraps everything; any internal error results in a
  silent allow. A broken scanner must not break the session.

## File selection

- **post-tool-use** scans only the event's file(s) — never the whole repo.
- **stop** events carry no file list; the runner falls back to the git-changed
  set: `git diff --name-only HEAD` plus untracked files
  (`git ls-files --others --exclude-standard`). Outside a git repo the set is
  empty and the hook allows.

Non-scannable paths are filtered first (only `.tsx`/`.jsx`, ignoring
`node_modules`, `.next`, `dist`, `build`, `out`, `coverage`, `.git`,
`.snapline`, `.turbo`).

## Codex normalization

`snapline hook codex <post-tool-use|stop>` accepts a documented neutral payload
on stdin:

```json
{ "cwd": "/abs/project", "files": ["src/app/page.tsx"] }
```

Claude-style `tool_input.file_path` is also accepted. Output is the plain-text
repair contract on stdout plus **exit 2 on block** (0 otherwise). Codex has no
stable hook API yet, so you wire your own event source — see
[codex.md](codex.md).

## Performance

PostToolUse cost is one file: parse, extract, run eight pure rules. Stop cost
is proportional to the changed set, not the repo. The plugin launcher applies a
30-second timeout on the CLI call.

## Telemetry (opt-in, local)

When `SNAPLINE_HOOK_LOG` is set to a file path, each hook run appends one JSON
line: `{ agent, kind, action, durationMs, files }`. The benchmark harness uses
this to count repair iterations and hook runtime. Logging failures never break
a hook; nothing is written when the variable is unset.

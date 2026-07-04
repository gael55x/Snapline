# Codex

**Status: beta.** Codex does not expose a stable lifecycle-hook API equivalent
to Claude Code's PostToolUse/Stop, so Snapline cannot hard-gate Codex today.
This page is honest about what works and what is missing.

## What works today

```sh
npx snapline install codex
```

This appends a `## Snapline (UI drift)` section to `AGENTS.md` — the
instruction file Codex reads — telling the agent to run
`snapline scan --changed` after editing `.tsx` files, to run it again before
finishing, and to repair exactly what the `SNAPLINE FOUND UI DRIFT` contract
says. Idempotent: an existing section is left alone.

This is instruction-level enforcement. It relies on the agent following its
instructions, which is precisely the failure mode described in
[why.md](why.md) — treat it as best-effort until Codex ships hooks.

## The hook command

The enforcement machinery already exists and is agent-agnostic. If your Codex
setup has any event mechanism (a wrapper script around the agent, a notify
hook, a file watcher), wire it to:

```sh
snapline hook codex post-tool-use   # after an edit
snapline hook codex stop            # before finishing
```

### Documented neutral payload

Both commands read JSON on stdin:

```json
{ "cwd": "/abs/project", "files": ["src/app/page.tsx"] }
```

- `post-tool-use` requires at least one file; absolute paths under `cwd` are
  relativized. Claude-style fields (`tool_input.file_path`, `file_path`) are
  also accepted, so a future Codex hook API with a similar shape works
  unchanged.
- `stop` accepts an empty or missing `files` list and falls back to the
  git-changed set (tracked diff against HEAD + untracked files).

### Exit-code semantics

| Result        | stdout                    | exit code |
| ------------- | ------------------------- | --------- |
| clean         | nothing                   | 0         |
| warnings only | repair contract (context) | 0         |
| errors        | repair contract           | **2**     |

Exit 2 means block. A wrapper script can treat it like any failing check: feed
stdout back to the agent and retry, or fail the step.

## Example wiring

A minimal wrapper that gates a Codex run the way the Stop hook gates Claude:

```sh
codex exec "$PROMPT"
echo "{\"cwd\": \"$PWD\"}" | snapline hook codex stop || {
  echo "UI drift found — contract above"; exit 1;
}
```

`snapline scan --changed` (exit 1 on errors) works as a simpler CI-style gate;
the `hook codex` form exists so event-driven wiring gets the same
policy — loop guard semantics, never-throw, git fallback — as Claude
([hooks.md](hooks.md)).

## What is missing

- No stable Codex lifecycle-hook API: nothing fires automatically after each
  edit, and nothing can force a repair before the agent finishes.
- Consequently no `codex-raw` / `codex-snapline` benchmark modes yet
  ([benchmark.md](benchmark.md) lists them as planned).

## Why this becomes first-class automatically

Core never sees agent-specific fields — adapters normalize payloads into a
neutral `HookEvent`, and one shared policy decides
([architecture.md](architecture.md)). The Codex adapter, exit-code contract,
and repair-contract format are already in place; when Codex ships lifecycle
hooks, support means registering them in the installer, not building an engine.

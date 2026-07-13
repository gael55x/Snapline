# Codex

**Status: preview.** Snapline installs current Codex `PostToolUse` and `Stop`
hooks. The payload and response contracts are covered by adapter and CLI tests;
a real interactive Codex session is still required before calling the adapter
production-verified.

## Install

```sh
npx @usesnapline/cli install codex
npx snapline doctor codex
```

This merges Snapline into `.codex/hooks.json`. Existing hooks are preserved.
The installed hooks are:

- `PostToolUse`, matched against the `Edit|Write` aliases for `apply_patch`
- `Stop`, with one repair retry guarded by `stop_hook_active`

Codex requires project-local hooks to be reviewed and trusted. Open `/hooks`
in Codex after installation and approve the exact project hook definitions.

## Lifecycle

After `apply_patch`, Codex sends the patch command on stdin. Snapline extracts
the added, updated, deleted, and moved file paths, scans only relevant
`.tsx`/`.jsx` files, and returns structured JSON:

- errors: `decision: "block"` with the repair contract as `reason`
- warnings: `hookSpecificOutput.additionalContext`
- clean or irrelevant edits: no output

At `Stop`, Snapline scans git-changed and untracked UI files. Errors return a
continuation decision so Codex repairs the files before finishing. If
`stop_hook_active` is already true, Snapline does not start another loop.

The hook command remains available for contract testing:

```sh
snapline hook codex post-tool-use
snapline hook codex stop
```

Both commands read the official Codex payload from stdin and exit 0. Decisions
travel as JSON on stdout; plain text is not used because Codex ignores it for
these events.

## Known limits

- Codex hook interception does not cover every shell or tool path. The Stop
  hook is the final backstop for files changed through an unobserved path.
- Project hooks do not run until the user trusts them.
- The committed Codex benchmark predates lifecycle-hook support. It measured
  an AGENTS.md instruction plus scan-before-finish workflow, not this hook gate.

Disable the integration with `npx snapline uninstall codex`. Only Snapline
entries are removed from `.codex/hooks.json`.

See the current Codex [hooks reference](https://learn.chatgpt.com/docs/hooks).

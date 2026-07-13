# Cursor

**Status: preview.** Snapline installs current Cursor `postToolUse` and `stop`
hooks plus a project rule. The adapter contracts are tested; a real Cursor
desktop or cloud-agent session is still required before calling the integration
production-verified.

## Install

```sh
npx @usesnapline/cli install cursor
npx snapline doctor cursor
```

The installer merges two project hooks into `.cursor/hooks.json` and writes
`.cursor/rules/snapline.mdc`. Existing hooks are preserved.

```json
{
  "version": 1,
  "hooks": {
    "postToolUse": [
      {
        "command": "snapline hook cursor post-tool-use",
        "matcher": "Write|Edit"
      }
    ],
    "stop": [
      {
        "command": "snapline hook cursor stop",
        "loop_limit": 1
      }
    ]
  }
}
```

For a local package install, the command uses
`npx --no-install snapline ...`.

## Lifecycle

After a matched write, Snapline scans `tool_input.file_path`. Drift is returned
as `additional_context`, which Cursor injects after the tool result. Cursor's
`postToolUse` contract does not block a completed edit.

At `stop`, Snapline scans git-changed and untracked UI files. Errors produce a
`followup_message`, causing Cursor to continue with the repair contract. The
installed `loop_limit: 1` and the payload's `loop_count` prevent infinite
repair loops.

## Known limits

- The project rule is guidance; the Stop hook is the enforcement backstop.
- Hook execution in Cursor cloud agents begins only after the environment is
  writable.
- No Cursor benchmark slice has been run. Do not infer detection or latency
  results from source files or adapter tests.

Disable the integration with `npx snapline uninstall cursor`. Snapline removes
only its hook entries and deletes the rule file only when its contents are
unchanged, so user edits are not discarded.

See the current Cursor [hooks reference](https://cursor.com/docs/hooks).

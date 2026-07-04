# Cursor

**Status: experimental.** Cursor has no stable lifecycle-hook API, so Snapline
support is instruction-level only: a project rule, not a gate.

## Install

```sh
npx snapline install cursor
```

This writes `.cursor/rules/snapline.mdc`:

```
---
description: Snapline keeps AI-generated UI on-system
alwaysApply: true
---

This project uses Snapline (https://github.com/gael55x/Snapline).

After editing any .tsx file, run `snapline scan --changed` and repair every
error the SNAPLINE FOUND UI DRIFT contract lists before finishing:

- Never use raw hex colors, inline style objects, or arbitrary Tailwind values.
- Never use raw palette classes (bg-blue-500); use semantic tokens (bg-primary).
- Use the project's shadcn components (Button, Input, Dialog, Card) instead of
  raw primitives.
```

Idempotent — rewritten only if the content differs.

## What this does and does not do

`alwaysApply: true` puts the rule in every Cursor conversation for the project,
so the agent is told to run the scanner and honor repair contracts. But nothing
enforces it:

- No hook fires after an edit.
- Nothing blocks the agent from finishing with drift in place.
- Instruction adherence decays over a long session — the exact problem
  described in [why.md](why.md).

There is deliberately no `snapline hook cursor` command: with no event source
to wire it to, it would imply a gate that does not exist.

## The backstop: scan in CI

Since the editor side cannot enforce, put the deterministic gate where one
exists — CI. `snapline scan` exits 1 when any error-severity violations are
found:

```yaml
# .github/workflows/snapline.yml
- run: npm ci
- run: npx snapline scan
```

For faster PR feedback, scan only the changed set (requires git history in the
checkout):

```sh
npx snapline scan --changed
```

The failure output is the same repair contract the hooks produce
([repair-contracts.md](repair-contracts.md)), so pasting it back into Cursor
gives the agent exact instructions. `snapline fix --safe` can knock out the
mechanical portion first.

## Path to first-class support

Core is agent-agnostic; adapters only normalize payloads
([architecture.md](architecture.md)). If Cursor ships lifecycle hooks, Cursor
gets the same PostToolUse/Stop treatment as [Claude Code](claude.md) — until
then, rule file plus CI scan is the honest setup.

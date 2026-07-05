# Quickstart

## Install

```sh
npm i -D @usesnapline/cli
npx snapline init
npx snapline install claude
```

Install the package before running `npx snapline` — without a local install,
npx resolves the bare `snapline` name to an unrelated legacy package.

`init` detects your project (Next.js, Tailwind, shadcn `components.json`, the
`components/ui` directory), writes `snapline.yml` with defaults, and creates a
self-gitignored `.snapline/` state directory. It never overwrites an existing
`snapline.yml`.

`install claude` merges two hooks into `.claude/settings.json`: PostToolUse on
`Write|Edit|MultiEdit` and Stop. The exact JSON is in [hooks.md](hooks.md).
`snapline init --claude` does both steps in one command.

## What happens on the next agent edit

The agent writes a file with drift; the PostToolUse hook scans that one file
and blocks with a repair contract:

```
SNAPLINE FOUND UI DRIFT

src/app/settings/page.tsx

3 violations:
- [error] arbitrary value: mt-[13px] (line 8)
- [error] raw <button> used while <Button> exists (line 15)
- [warn] raw Tailwind color: text-gray-500 (line 9)

Repair:
- Replace mt-[13px] with mt-3 (12px) if the value is still needed — arbitrary values bypass the design scale.
- Import Button from "@/components/ui/button" and replace the raw <button> with <Button>. Use variant props (variant="default" | "outline" | "ghost" | "destructive") instead of color classes.

Recommended:
- Replace text-gray-500 with text-muted-foreground.
```

The agent applies the required actions and continues. When it tries to finish,
the Stop hook scans the full git-changed set; remaining errors block completion
the same way. Format details: [repair-contracts.md](repair-contracts.md).

## Scan, score, fix

```sh
npx snapline scan             # whole project; exit 1 if any errors
npx snapline scan --changed   # only git-changed + untracked files
npx snapline scan --json      # machine-readable
npx snapline score            # drift score summary; always exit 0
npx snapline fix --safe       # apply only mechanical, unambiguous fixes
npx snapline fix --safe --dry-run
```

`fix` accepts only `--safe`; anything ambiguous is left for the agent. Safe
fixes are limited to unambiguous color-class swaps (`bg-blue-500` →
`bg-primary`), simple `<button>`/`<input>` → `<Button>`/`<Input>` swaps, and
static inline spacing that maps exactly onto the Tailwind scale.

## Check the setup

```sh
npx snapline doctor
```

Verifies config, Tailwind, tsconfig aliases, component resolution, Claude
hooks, Node >= 20, git, and the `.snapline/` directory.

## Alternative: Claude Code plugin

Instead of `install claude`, add the plugin from the repo's marketplace:

```
/plugin marketplace add gael55x/Snapline
/plugin install snapline
```

The plugin wires the same two hooks and calls the project-local CLI. If the CLI
is not installed, hooks allow silently — Snapline never breaks a session. See
[claude.md](claude.md).

## Other agents

- Codex (beta, instruction-level until Codex ships hooks): [codex.md](codex.md)
- Cursor (experimental, rule file only): [cursor.md](cursor.md)

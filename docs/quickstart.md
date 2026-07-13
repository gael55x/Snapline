# Quickstart

Three commands, ~2 minutes, then your agent can't ship off-system UI anymore.

Works on any React + Tailwind project; shadcn/ui projects get the most out of
the component rules. You need Node 20+ and git.

## Step 1 — install

```sh
npm i -D @usesnapline/cli
```

> Always install before running `npx snapline`. Without a local install, npx
> resolves the bare `snapline` name to an unrelated legacy package.

## Step 2 — initialize

```sh
npx snapline init
```

You should see something like:

```
✔ Next.js detected
✔ Tailwind detected
✔ shadcn components.json found
✔ ui directory: src/components/ui
✔ wrote snapline.yml
✔ created .snapline/ (state, self-gitignored)
• next: "snapline install claude" to enable the repair loop
```

`init` reads your project — `components.json`, the ui directory, tsconfig (or
jsconfig) aliases — and writes `snapline.yml` mapping the components you
actually have. It never overwrites an existing `snapline.yml`.

<details>
<summary>Lines show • or ⚠ instead of ✔?</summary>

- <b>“Tailwind not detected”</b> — Snapline's rules assume Tailwind classes;
  without it only the inline-style and hex rules are useful.
- <b>“no components/ui directory”</b> — component rules (require-button etc.)
  stay dormant until an import in <code>snapline.yml</code> resolves to a real
  file. Everything else works. Add mappings later in
  <a href="config.md">config.md</a>.
- Wrong ui path or custom tokens (e.g. a <code>brand</code> color)? Edit
  <code>snapline.yml</code> — it's ~40 readable lines.

</details>

## Step 3 — wire the hooks

```sh
npx snapline install claude
```

```
✔ Claude hooks installed: .claude/settings.json
  PostToolUse (Write|Edit|MultiEdit) -> snapline hook claude post-tool-use
  Stop -> snapline hook claude stop
```

**Then restart your Claude Code session** — hooks are loaded at session start,
so the current session won't see them.

That's the whole setup. (`npx snapline init --claude` does steps 2+3 at once.)

## Step 4 — watch it work (30 seconds)

Paste a deliberately drifted line into any `.tsx` file:

```tsx
export const Bad = () => <button className="bg-blue-500 mt-[13px]">Buy</button>
```

```sh
npx snapline scan
```

```
src/app/bad.tsx
  ✖ src/app/bad.tsx:1:44
    Arbitrary Tailwind value "mt-[13px]" [no-arbitrary-tailwind]
    fix: Replace mt-[13px] with mt-3 (12px) if the value is still needed — arbitrary values bypass the design scale.
  ✖ src/app/bad.tsx:1:25
    Raw <button> used while <Button> exists [require-button-component]
    ...

2 error(s), 1 warning(s) — drift score 15
```

Now ask Claude to edit that file. The PostToolUse hook feeds it the same
violations as a repair contract, it fixes them before continuing, and the Stop
hook keeps it from finishing while errors remain. You don't run anything —
the loop is automatic from here.

## Day-to-day commands

```sh
npx snapline scan             # whole project; exit 1 if any errors (CI-ready)
npx snapline scan --changed   # only git-changed + untracked files
npx snapline scan --json      # machine-readable ScanResult
npx snapline score            # drift score summary; always exit 0
npx snapline fix --safe       # apply only mechanical, unambiguous fixes
npx snapline doctor claude    # verify config, aliases, components, and Claude hooks
npx snapline uninstall claude # remove only Snapline's Claude hook entries
```

`fix` accepts only `--safe`: unambiguous color swaps (`bg-blue-500` →
`bg-primary`), simple `<button>`/`<input>` component swaps, and inline spacing
that maps exactly onto the scale. Anything ambiguous is left for the agent —
that's the design.

<details>
<summary>Troubleshooting: hooks don't seem to fire</summary>

1. Restart the Claude Code session (hooks load at session start).
2. <code>npx snapline doctor claude</code> — it checks both hooks are present in
   <code>.claude/settings.json</code>, plus everything else.
3. Blocked and unsure why? The block reason <i>is</i> the repair contract;
   <code>npx snapline scan --changed</code> reproduces it in your terminal.
4. Using the plugin instead of the CLI install? If the CLI package is missing,
   hooks allow with visible recovery context — install it with
   <code>npm i -D @usesnapline/cli</code>.

</details>

## Alternative: Claude Code plugin

```
/plugin marketplace add gael55x/Snapline
/plugin install snapline
```

Wires the same two hooks via the plugin system; the project still needs the
CLI package (step 1). Details: [claude.md](claude.md).

## Other agents

- Codex — preview lifecycle hooks; interactive verification pending: [codex.md](codex.md)
- Cursor — preview lifecycle hooks; interactive verification pending: [cursor.md](cursor.md)

Next: [mental-model.md](mental-model.md) for the loop in one diagram, or
[rules.md](rules.md) for exactly what gets flagged and what never does.

# Introduction

Snapline is an **agent UI repair hook**. It keeps AI-generated React/Tailwind/shadcn
UI on-system by scanning the files a coding agent edits, detecting design-system
drift, and handing the agent an exact repair contract before it can finish.

## The core loop

```
agent edits a .tsx file
        │
        ▼
PostToolUse hook scans that one file
        │
        ├─ errors → block: agent gets a repair contract, fixes itself
        └─ clean/warns → continue
        │
        ▼
Stop hook scans the whole changed set
        │
        ├─ errors → agent cannot finish until repaired
        └─ clean → done
```

That is the entire product: detect drift at edit time, feed exact instructions
back into the agent's own loop, verify at stop time. See
[mental-model.md](mental-model.md) for the full loop and
[quickstart.md](quickstart.md) to set it up.

## What Snapline detects

Nine rules over TSX/JSX: raw hex colors, inline style objects, arbitrary
Tailwind values (`mt-[13px]`), raw palette classes (`bg-blue-500`), raw
`<button>`/`<input>` where a system component exists, hand-rolled dialogs and
cards, and duplicate component files (`CustomButton.tsx`). Full detail in
[rules.md](rules.md).

## What Snapline is not

- **Not a generic design-system scanner.** It targets one stack —
  React + Tailwind + shadcn-style components — and one failure mode: agent drift.
- **Not a PR review bot first.** The primary surface is the agent hook, not the
  pull request. `snapline scan` works in CI, but post-hoc review is the backstop,
  not the design.
- **Not a SaaS dashboard.** There is no service, no account, no telemetry upload.
- **Not an AI UI generator.** Snapline never writes new UI; it repairs what the
  agent wrote.
- **Not a visual regression tool.** It reads source code, not rendered pixels.
- **Not a Figma sync tool.** Tokens come from your config and CSS variables,
  not a design file.
- **Not a local-first context engine.** It does not index your repo or inject
  design context up front; it checks output and repairs it.

## How it runs

- **No cloud.** Everything executes locally in the hook process.
- **No database.** State is a self-gitignored `.snapline/` directory.
- **No LLM in the scanner.** Detection is the TypeScript compiler API plus pure
  rules — the same input always produces the same violations, byte for byte.
- **Never breaks a session.** Hooks catch all errors and allow on failure.

## Where to go next

| Page                                                                   | What it covers                                |
| ---------------------------------------------------------------------- | --------------------------------------------- |
| [why.md](why.md)                                                       | The problem and why a hook is the right shape |
| [quickstart.md](quickstart.md)                                         | Install and first repair loop                 |
| [architecture.md](architecture.md)                                     | Monorepo layout and data flow                 |
| [hooks.md](hooks.md)                                                   | Exact hook wiring and JSON contracts          |
| [rules.md](rules.md)                                                   | All nine rules and false-positive guards      |
| [config.md](config.md)                                                 | `snapline.yml` reference                      |
| [repair-contracts.md](repair-contracts.md)                             | The contract format agents receive            |
| [claude.md](claude.md) / [codex.md](codex.md) / [cursor.md](cursor.md) | Per-agent setup                               |
| [benchmark.md](benchmark.md)                                           | agent-ui-drift-bench methodology              |

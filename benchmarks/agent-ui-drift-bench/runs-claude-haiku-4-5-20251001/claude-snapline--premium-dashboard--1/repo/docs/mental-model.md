# Mental model

One loop, two gates, deterministic decisions.

## The loop

```
            ┌──────────────────────────────────────────────┐
            │                                              │
            ▼                                              │
   agent edits file                                        │
            │                                              │
            ▼                                              │
   PostToolUse: scan the edited file                       │
            │                                              │
   ┌────────┴─────────┐                                    │
   │ errors           │ clean / warns only                 │
   ▼                  ▼                                    │
 block with       allow (warns attached                    │
 repair contract  as context)                              │
   │                  │                                    │
   └── agent repairs ─┴────────► agent tries to finish     │
                                       │                   │
                                       ▼                   │
                          Stop: scan the git-changed set   │
                                       │                   │
                              ┌────────┴─────────┐         │
                              │ errors           │ clean   │
                              ▼                  ▼         │
                        block: cannot finish   done        │
                              │                            │
                              └── agent repairs ───────────┘
```

PostToolUse scans only the file that was just edited — never the whole repo.
Stop scans the union of git-tracked changes against HEAD plus untracked files.
Neither gate can loop forever: a Stop event that already retried once
(`stop_hook_active`) never blocks again; its contract is surfaced as context
instead.

## Severity semantics

Every rule has a configured severity (`off | warn | error`, see
[config.md](config.md)). The hook policy is a direct mapping:

| Scan outcome         | Hook decision                                            |
| -------------------- | -------------------------------------------------------- |
| any error violations | **block** — repair contract returned, agent must act     |
| warnings only        | **allow with context** — contract attached, non-blocking |
| clean                | **allow** silently, no output                            |

The same split shows up inside a contract: error instructions are `Repair:`
(required), warning instructions are `Recommended:` (optional). See
[repair-contracts.md](repair-contracts.md).

Errors are reserved for high-confidence rules (raw hex, inline styles,
arbitrary values, raw button/input). Heuristic rules (dialog and card
detection, palette colors, duplicate files) default to warn — advisory, never
blocking on a guess.

## Determinism guarantee

The scanner is a pure function of the file contents and the config:

- **No LLM.** Rules are pattern matching over a TypeScript AST.
- **No network.** Everything runs in the local hook process.
- **Static analysis only.** Class names are read from string literals, template
  quasis, and string arguments of helpers like `cn()`/`clsx()`. Dynamic
  expressions are skipped, never guessed.
- **Same input, same output.** Identical file + config always yields identical
  violations, instructions, and scores. The benchmark harness enforces this:
  scanning the same sample twice must produce byte-identical results.

## Failure model

Hooks never break the session. `runHook` catches all errors and allows; the
plugin launcher allows silently when the CLI is missing; malformed hook
payloads are ignored. The worst case of a Snapline failure is no gate — never
a stuck agent.

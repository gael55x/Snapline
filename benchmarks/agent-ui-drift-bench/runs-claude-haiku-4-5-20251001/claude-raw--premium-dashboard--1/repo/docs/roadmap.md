# Roadmap

Priorities after 1.0. Nothing here is a commitment with a date; items move
when the underlying platform (agent hook APIs) moves.

## Near term

- **Public benchmark run.** Execute agent-ui-drift-bench's full matrix
  (8 modes × 30 prompts × 3 runs) and publish reports + graphs. The harness is
  complete; this needs API budget and wall time, not code.
- **Codex first-class.** The adapter and normalized `HookEvent` contract are
  ready; blocked on Codex shipping a stable lifecycle-hook API. Until then
  Codex stays beta (AGENTS.md instructions + documented payload wiring).
- **`.jsx` support.** The parser already handles JSX; enabling it is mostly
  fixture and test coverage.

## Medium term

- **Cursor hooks.** Same story as Codex: adapt when a stable hook API exists;
  instruction-level rules until then.
- **Tailwind v4 token discovery.** Read `@theme` blocks from CSS-first configs
  (read-css-vars already parses custom properties; wire it into the allowed
  token set).
- **Custom rule severity per path.** e.g. relax rules in `src/app/(marketing)`.
- **More safe fixes** — only where mappings stay unambiguous (dialog/card
  rewrites stay agent territory).

## Explicit non-goals

These stay out regardless of demand — they change what Snapline is:

- Cloud service, dashboard, or database
- LLM calls inside the scanner (determinism is the product)
- Visual regression / screenshot diffing
- Figma or design-file sync
- Generating UI

See [introduction.md](introduction.md) for the category definition.

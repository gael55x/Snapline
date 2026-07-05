# Roadmap

Priorities after 1.0. Nothing here is a commitment with a date; items move
when the underlying platform (agent hook APIs) moves.

## Shipped since first draft

Public benchmark results (Sonnet 5 matrix + Haiku 4.5 and Codex/gpt-5.5
slices — see [benchmark.md](benchmark.md)) and full `.jsx`/`jsconfig.json`
project support.

## Near term

- **Complete the Codex slice retries** once the account quota resets (15
  quota-failed cells recorded in `reports/latest-codex.md`).
- **Codex first-class.** The adapter and normalized `HookEvent` contract are
  ready; blocked on Codex shipping a stable lifecycle-hook API. Until then
  Codex stays instruction-level (AGENTS.md + documented payload wiring).
- **Dynamic-className detection.** Fully computed `className` expressions are
  the scanner's known blind spot; a warn-tier "dynamic className on a raw
  primitive" rule would shrink it without violating the false-positive policy.
- **Cursor benchmark slice** (instruction-level, like Codex) so every shipped
  integration has published numbers.

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

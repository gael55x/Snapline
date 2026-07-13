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
- **Verify Codex hooks interactively.** The current `PostToolUse` and `Stop`
  contracts are implemented and tested; run the packed package in a trusted
  Codex project before promoting the adapter from preview.
- **Dynamic-className detection.** Fully computed `className` expressions are
  the scanner's known blind spot; a warn-tier "dynamic className on a raw
  primitive" rule would shrink it without violating the false-positive policy.
- **Cursor benchmark slice** using the current hook gate so every shipped
  integration has published numbers.

## Medium term

- **Verify Cursor hooks interactively.** Exercise desktop and cloud-agent hook
  behavior with the packed package before promoting the adapter from preview.
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

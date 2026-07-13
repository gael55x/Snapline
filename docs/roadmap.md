# Roadmap

No dates are implied. Release gates are evidence requirements, not feature
expansion.

## Before 1.0

- Verify Claude, Codex, and Cursor interactively with the same packed RC and
  archive the clean, drift, malformed, retry, and uninstall evidence.
- Publish a hand-labelled detection corpus with positive, negative, and
  boundary cases for every v1 rule.
- Accept or reduce the measured cold hook startup budget.
- Rerun a small pinned benchmark matrix on the candidate, or remove current
  comparative ranking copy.
- Publish and clean-install `1.0.0-rc.1`, then make the binary
  [exit checklist](release-1.0.md) entirely green.

## Immediately after 1.0

- Dynamic-className detection, with negative fixtures before implementation.
- Tailwind v4 CSS-first token discovery.
- Broader permission, encoding, interruption, large-file, and workspace tests.
- Real hook-trace analysis before considering a cache or persistent process.
- Quiet/verbose CLI modes if JSON and the current human output prove
  insufficient.

## Later

- Rule severity by path.
- More safe fixes where mappings remain unambiguous.
- Additional framework and agent adapters based on demonstrated use.
- Public rule extensibility only after independent consumers exist.

## Explicit non-goals

- Cloud service, dashboard, or database
- LLM calls inside the scanner
- Visual regression or screenshot diffing
- Figma/design-file synchronization
- UI generation

See [introduction.md](introduction.md) for the category boundary and the
[release-readiness audit](release-readiness-audit.md) for the evidence behind
this order.

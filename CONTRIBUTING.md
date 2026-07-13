# Contributing

Snapline accepts focused fixes and evidence-backed rule improvements. Keep the
core deterministic, local, and agent-independent.

## Setup

Requirements: Node 20 or 22, pnpm 9.15, and git.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

Before opening a pull request, run:

```sh
pnpm release:check
```

This covers lint, types, builds, tests, static benchmark determinism, published
report byte checks, docs, version metadata, and packed-package installation.

## Change rules

- Add a failing user-visible test before changing behavior.
- Give every rule positive, negative, and boundary fixtures. Heuristic findings
  should warn, not block.
- Keep file paths project-relative and preserve root-containment tests.
- Put agent-specific payload logic in its adapter; the core consumes only the
  canonical `HookEvent` and returns `HookDecision`.
- Do not add accepted configuration until it changes behavior.
- Treat public JSON/types as an API. Additive changes may stay on schema 1;
  removals or semantic changes need an explicit version decision.
- Do not add competitor numbers without raw run data, environment, exact tool
  versions, and a reproducible generation path.

Use conventional commits and keep formatting-only changes separate. Update the
changeset and user documentation when public behavior changes.

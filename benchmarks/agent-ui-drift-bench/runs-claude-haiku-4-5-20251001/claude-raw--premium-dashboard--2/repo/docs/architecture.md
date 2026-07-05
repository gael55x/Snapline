# Architecture

## Monorepo map

```
packages/
  contracts/        shared types only: config, violations, repair contracts,
                    scan results, hook events, benchmark shapes
  core/             scanner, rules, registries, hook policy, fixer, scorer,
                    reports — agent-agnostic, no CLI, no I/O contracts
  cli/              the `snapline` binary: init, install, scan, score,
                    fix, doctor, hook, benchmark
  adapters/
    claude/         Claude Code payload parsing + output formatting + install
    codex/          Codex neutral payload parsing + AGENTS.md install (beta)
    cursor/         .cursor/rules/snapline.mdc install (experimental)
  plugin-claude/    Claude Code plugin: hooks.json + zero-dep launcher scripts
fixtures/           three clean Next.js/shadcn apps (the benchmark zero baseline)
benchmarks/
  agent-ui-drift-bench/   modes, prompts, runners, reports, graphs
```

## Data flow

```
agent hook payload (stdin JSON)
        │
        ▼
adapter (claude/codex)          parse* → HookEvent { agent, kind, cwd,
        │                                 filePaths, stopAlreadyRetried }
        ▼
core runHook                    load config → build registries → scan files
        │                       → decide (errors block / warns warn / clean allow)
        ▼
HookDecision { action, agentMessage, contracts }
        │
        ▼
adapter                         format into the agent's output contract
        │                       (Claude JSON on stdout; Codex exit code 2)
        ▼
agent receives the repair contract
```

The key boundary: **adapters normalize agent payloads into `HookEvent`; core
never sees agent-specific fields.** Core decides from the neutral event only —
which is why a new agent is one adapter, not a fork of the engine.

## Contracts-first design

`@usesnapline/contracts` holds only types — `RuleId`, `Violation`,
`RepairContract`, `ScanResult`, `HookEvent`, `HookDecision`, benchmark shapes.
Every package depends on it; no package depends on another's internals. Rule
ids are stable across releases: new rules append, never rename.

## Scanning pipeline

Inside core, a file scan is a straight line of pure functions:

```
parseTsx (TS compiler API)
  → extractClassNames / extractJsxElements / extractInlineStyles / extractImports
  → FileScanContext
  → 8 file rules (context in, violation drafts out)
  → finalizeViolations (severity from config, "off" filtered, stable ids)
```

Project scans add one project-level rule (`no-duplicate-components`, which
looks at file names), the drift score, and the repair contracts.

## Parser choice

Snapline uses the TypeScript compiler API (`ts.createSourceFile`) rather than a
regex layer or a separate parser. TSX is TypeScript's native grammar, the
dependency already exists in any TS project, and the AST gives exact
line/column positions and clean separation between static strings and dynamic
expressions — which the static-only extraction guarantee depends on. Parsing
never executes project code.

## Code style

Core is small pure functions, no classes (the single exception is a
`ConfigError` subclass for typed config failures). Rules are functions of
`FileScanContext → violation drafts`; codemods are functions of
`SourceFile → text edits`; the hook policy is one function of
`(HookEvent, ScanResult) → HookDecision`. Registries are plain data built once
per scan:

- **Component registry** — configured components plus a `fileExists` flag; a
  component participates in `require-*` rules only when its import resolves to
  a real file.
- **Token registry** — allowed semantic color classes plus CSS variables
  discovered in the project.

## Related pages

- Hook wiring and JSON contracts: [hooks.md](hooks.md)
- Rule detection logic: [rules.md](rules.md)
- Benchmark harness: [benchmark.md](benchmark.md)

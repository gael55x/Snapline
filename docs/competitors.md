# Competitors and adjacent tools

Snapline's category is the **agent UI repair hook**: it runs inside the
agent's lifecycle, blocks on severe drift, and returns exact repair contracts
so the agent fixes itself before it can finish. The closest tools overlap in
useful ways; the comparison below follows their current public documentation
and does not treat historical benchmark results as current rankings.

## Capability matrix

| Capability                             | Snapline                             | Buoy CLI/App                        | eslint-plugin-tailwindcss           | shadcn MCP                          |
| -------------------------------------- | ------------------------------------ | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| Runs automatically after an agent edit | Yes, project hooks                   | No; CLI or PR app                   | Only when invoked by workflow       | No; agent-invoked registry tool     |
| Detects code-level design drift        | Yes, nine source rules               | Yes, broad source scanner           | Tailwind class subset               | No                                  |
| Uses project-specific system data      | Components, aliases, semantic colors | Auto-detected tokens/config         | Tailwind config                     | Configured component registries     |
| Produces repair actions                | Structured per-file contracts        | Fix suggestions and token autofix   | Rule diagnostics; some fixes        | Installs selected registry items    |
| Forces in-session agent correction     | Yes, error gate plus retry           | Only if separately wired/instructed | Only if separately wired/instructed | No validation gate                  |
| Requires screenshots/browser           | No                                   | No                                  | No                                  | No                                  |
| Can run locally before review          | Yes                                  | Yes                                 | Yes                                 | Yes, for discovery/install          |
| CI use                                 | `snapline scan`                      | CLI/GitHub App                      | Standard ESLint workflow            | Not an enforcement workflow         |
| Remote operational dependency          | None for scans                       | None for local CLI                  | None                                | Registry access may require network |

This is a capability comparison, not a benchmark result. Buoy's current docs
describe an open-source CLI and GitHub App, broad token/drift detection, smart
fixes, and AI context generation. shadcn's MCP docs describe registry browse,
search, and install across Claude, Cursor, and Codex. The Tailwind plugin's
documented arbitrary-value rule can load project Tailwind configuration and
apply unique substitutions. Those are stronger claims than the older copy in
this repository acknowledged.

## shadcn MCP

- **What it does well:** component discovery and scaffolding — the agent can
  browse the registry and pull in real component code instead of guessing.
- **Category:** MCP tooling / component source.
- **Where Snapline differs:** MCP improves what the agent _starts_ with; it
  does not check what the agent _wrote_. An agent with MCP can still emit
  `bg-blue-500` next to a freshly installed Button. They compose well —
  Snapline ships a combined benchmark mode.
- **Benchmark mode:** `claude-shadcn-mcp`, `claude-shadcn-mcp-snapline`.
- **Setup:** `.mcp.json` with the shadcn MCP server ([shadcn docs](https://ui.shadcn.com/docs/mcp)).
- **Reproduction notes:** benchmark mode writes the `.mcp.json` config; server availability depends on network at run time.

## eslint-plugin-tailwindcss

- **What it does well:** class-level lint rules, including configuration-aware
  detection and correction of unnecessary arbitrary values.
- **Category:** linter.
- **Where Snapline differs:** ESLint sees classes, not the design system. It
  cannot know that a raw `<button>` should be `<Button>`, that
  `BaseModal.tsx` duplicates `Dialog`, or map `bg-blue-500` to `bg-primary`.
  It also only acts when something runs it; agents routinely skip or ignore
  lint output unless hard-wired into their loop. Snapline's repair contracts
  name the exact system replacement, and its hooks force the round trip.
- **Benchmark mode:** `claude-tailwind-eslint`.
- **Setup:** [npm](https://www.npmjs.com/package/eslint-plugin-tailwindcss); flat config with recommended rules.
- **Reproduction notes:** the benchmark installs eslint@9 + the plugin and instructs the agent to keep `npx eslint src` clean.

## Buoy (@buoy-design/cli)

- **What it does well:** broad source-level drift detection, token discovery,
  health reporting, smart fixes, a local CLI, and PR integration.
- **Category:** design drift scanner (post-hoc / on-demand).
- **Where Snapline differs:** Buoy's documented lifecycle is CLI/CI/PR plus AI
  context generation. Snapline's narrow claim is automatic edit-time and Stop
  hooks with a canonical machine-readable contract. A separately wired Buoy
  agent workflow could narrow that difference and should be benchmarked rather
  than dismissed.
- **Benchmark mode:** `claude-buoy`.
- **Setup:** [npm](https://www.npmjs.com/package/@buoy-design/cli).
- **Reproduction notes:** the benchmark installs the CLI, captures `buoy --help`
  into SETUP-NOTES.md at setup time, and instructs the agent to run its check.
  If setup fails on a given version, the run is recorded as a failure with the
  reason — never silently dropped.

## driftguard

- **What it does well:** deterministic design-system compliance checks for
  AI-generated UI — closest to Snapline's scanner in intent.
- **Category:** compliance checker (on-demand CLI).
- **Where Snapline differs:** the hook. A checker the agent may run is
  advisory; a PostToolUse gate plus a Stop gate is enforcement. Snapline also
  ships repair contracts (exact replacements, safe-fix flags) rather than
  findings alone.
- **Benchmark mode:** `claude-drift-guard`.
- **Setup:** [npm](https://www.npmjs.com/package/driftguard).
- **Reproduction notes:** same protocol as Buoy (install, capture `--help`, instruct, record failures).

## Project instructions / CLAUDE.md

- **What it does well:** cheap, immediate, and genuinely reduces drift early in
  a session. Everyone should have design-system notes in CLAUDE.md.
- **Category:** guidance.
- **Where Snapline differs:** instructions are advisory and decay — long
  sessions, compacted context, and "just make it look premium" prompts erode
  them. Snapline is indifferent to context length; the gate fires on every
  edit. The benchmark measures exactly this gap.
- **Benchmark mode:** `claude-project-instructions`.
- **Reproduction notes:** the benchmark writes a fixed CLAUDE.md (see `modes/shared.ts`) so the instruction text is identical across runs.

## Generic PR review bots

- **What they do well:** broad review coverage at PR time, including things
  Snapline doesn't look at.
- **Category:** post-hoc review.
- **Where Snapline differs:** by PR time the agent session is over; repair
  means a new round trip with lost context. Snapline repairs inside the session
  where the fix is one tool call away. They're complementary — a review bot
  should find zero UI drift in a Snapline-gated repo.
- **Benchmark mode:** none (measuring review-time repair round trips is a
  different experiment; see docs/benchmark.md limitations).

## Visual regression tools

- **What they do well:** catching rendered-pixel changes against baselines.
- **Category:** visual testing.
- **Where Snapline differs:** drift that follows the design system renders
  differently on purpose; drift that mimics it (hex approximations of your
  tokens) renders identically until a theme change breaks it. Source-level
  token discipline and pixel diffing answer different questions. Snapline
  never renders anything.
- **Benchmark mode:** none (no comparable metric).

## Benchmark fairness

The committed primary benchmark ran older, historically unpinned competitor
installations. New runs pin `@buoy-design/cli@0.3.38`, `driftguard@0.1.1`,
`eslint-plugin-tailwindcss@3.17.0` with `eslint@9.17.0`, and `shadcn@4.13.0`,
then record resolved versions. Until those pinned modes are rerun on the release
candidate, the old percentages are historical observations, not evidence that
Snapline currently outperforms these projects.

# Competitors and adjacent tools

Snapline's category is the **agent UI repair hook**: it runs inside the
agent's lifecycle, blocks on severe drift, and returns exact repair contracts
so the agent fixes itself before it can finish. Everything below solves a real
problem; none of them closes that loop. Guidance helps. Linting catches some
class-level issues. Post-hoc scanners catch drift later. Snapline makes the
agent repair drift before it finishes.

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

- **What it does well:** class-level lint rules (`no-arbitrary-value`,
  `no-custom-classname`, ordering) in a mature ESLint ecosystem.
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

- **What it does well:** design drift detection for design systems —
  "catch design drift before it ships," with a CLI a team can run over a repo.
- **Category:** design drift scanner (post-hoc / on-demand).
- **Where Snapline differs:** Buoy reports drift when someone runs it; the loop
  from finding to fixing is a human's (or an instructed agent's) job. Snapline
  runs inside the agent lifecycle, blocks completion, and returns
  machine-followable repair instructions. Different moments in the workflow.
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

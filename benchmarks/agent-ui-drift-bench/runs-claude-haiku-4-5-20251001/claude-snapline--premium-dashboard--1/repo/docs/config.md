# Configuration

Snapline reads `snapline.yml` from the project root. No file means defaults —
everything below works with zero config. Unknown top-level keys and unknown
rule names are rejected with a clear error (`snapline doctor` surfaces this).

## The default file

`snapline init` detects your project and writes this (component entries are
filtered to the files that actually exist in your ui directory; the import
alias comes from `components.json` when present):

```yaml
version: 1

stack:
  framework: next
  ui: shadcn
  styling: tailwind

components:
  Button:
    import: "@/components/ui/button"
    preferOver:
      - "button"
  Input:
    import: "@/components/ui/input"
    preferOver:
      - "input"
  Dialog:
    import: "@/components/ui/dialog"
    preferOver:
      - 'div[role="dialog"]'
  Card:
    import: "@/components/ui/card"
    preferOver:
      - "div[data-card]"

tokens:
  colors:
    semanticOnly: true
    allowed:
      - bg-background
      - text-foreground
      - bg-primary
      - text-primary-foreground
      - bg-secondary
      - text-secondary-foreground
      - text-muted-foreground
      - border-border
      - bg-card
      - text-card-foreground
      - bg-destructive
      - text-destructive-foreground

rules:
  noRawHex: error
  noInlineStyle: error
  noArbitraryTailwind: error
  noRawPaletteColor: warn
  requireButtonComponent: error
  requireInputComponent: error
  requireDialogComponent: warn
  requireCardComponent: warn
  noDuplicateComponents: warn

fix:
  safeAutofix: false
  preferAgentRepair: true

benchmark:
  enabled: true
  scorer: ui-drift-score-v1
```

## Key reference

**`version`** — must be `1`.

**`stack`** — project description. `framework`: `next | vite | remix | other`
(default `next`); `ui`: `shadcn | custom` (default `shadcn`); `styling` is
always `tailwind`.

**`components`** — design-system components and what they replace. Each entry
needs an `import` string; `preferOver` lists the raw patterns it supersedes.
This map drives the `require-*` rules: `Button` powers
`requireButtonComponent`, `Input` powers `requireInputComponent`, and so on.
Crucially, a rule only fires when the component's import actually resolves to a
file on disk (**fileExists gate**, checked against tsconfig path aliases with
`.tsx`/`.ts`/`index.*` resolution). Delete a component or point the import at
nothing and its rule goes quiet — Snapline never demands a component the
project does not have. Omitting the whole section keeps the four defaults.

**`tokens.colors.semanticOnly`** — when `true` (default), raw palette classes
(`bg-blue-500`, `bg-white`) violate `noRawPaletteColor`; when `false`, that
rule is disabled entirely.

**`tokens.colors.allowed`** — the semantic color classes that pass. Matching is
on the base class: variant prefixes (`dark:hover:bg-primary`) and opacity
suffixes (`bg-primary/80`) are stripped first, so allowing `bg-primary` covers
all its variants and opacities. Add your own theme tokens here (e.g.
`bg-accent`, `text-warning`).

**`rules`** — severity per rule: `off | warn | error`. Errors block the agent;
warnings attach as context; `off` disables. Semantics in
[mental-model.md](mental-model.md), rule behavior in [rules.md](rules.md).

**`fix.safeAutofix`** — reserved for auto-applying safe fixes during hook runs;
currently the hook path never edits files, and safe fixes run only via
`snapline fix --safe`. Default `false`.

**`fix.preferAgentRepair`** — declares the repair philosophy (contracts over
autofix). Default `true`.

**`benchmark`** — `enabled` (default `true`) and the scorer id, always
`ui-drift-score-v1` ([benchmark.md](benchmark.md)).

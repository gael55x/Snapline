# Rules

Nine rules, each with a fixed detection scope and an exact repair. Severities
are configurable per rule ([config.md](config.md)); defaults shown here.

## no-raw-hex (error)

Hex color values in class names or inline styles: `text-[#6366f1]`,
`bg-[#111827]`, `style={{ color: "#6366f1" }}`.

Repair: replace with a semantic token class (`bg-primary`, `text-foreground`,
`border-border`). Never a safe fix — hex-to-token mapping needs human or agent
judgment.

## no-inline-style (error)

Any `style={{ ... }}` object literal on a JSX element.

Repair: remove the attribute. When every property is static and maps exactly
onto the Tailwind scale (`style={{ marginTop: "16px" }}`), the instruction
names the exact classes (`mt-4`) and the violation is safe-fixable; otherwise
the instruction is advisory.

## no-arbitrary-tailwind (error)

Arbitrary-value utilities: `mt-[13px]`, `w-[472px]`, `text-[14px]`. Hex-valued
classes are left to no-raw-hex (no double counting). CSS-variable references
like `bg-[var(--brand)]` still count — the token belongs in the Tailwind theme,
not inlined.

Repair: the nearest on-scale class. Exact matches (`text-[14px]` → `text-sm`)
are safe fixes; near misses get "Replace mt-[13px] with mt-3 (12px) if the
value is still needed". Note `px-7` is a scale utility (28px), not an arbitrary
value — it is never flagged, however unusual it looks.

## no-raw-palette-color (warn)

Raw Tailwind palette classes when the project is semantic-only: `bg-blue-500`,
`text-gray-500/80`, `border-zinc-200`, `bg-white`. Classes on the
`tokens.colors.allowed` list pass; variant prefixes (`dark:hover:`) and
`/opacity` suffixes are stripped before checking.

Repair: unambiguous mappings are named exactly and safe-fixable
(`text-gray-500` → `text-muted-foreground`, `bg-blue-500` → `bg-primary`).
Ambiguous ones get options ("bg-background or bg-card, depending on the
surface"). Disabled entirely when `tokens.colors.semanticOnly: false`.

## require-button-component (error)

Raw `<button>` while the project's `<Button>` exists. Safe-fixable only when
the element is simple: no spread props, and only known-safe attributes (`type`,
`onClick`, `disabled`, `className`, `id`, plus `aria-*`/`data-*`).

## require-input-component (error)

Raw `<input>` while `<Input>` exists. Skips `type="hidden"` (data plumbing, not
UI) and `type="checkbox"`/`type="radio"` (they have dedicated shadcn
components; converting to `<Input>` would be wrong).

## require-dialog-component (warn)

Likely hand-rolled dialogs while `<Dialog>` exists. High-confidence signals
only: `role="dialog"`, `aria-modal`, or a `fixed inset-0` overlay with a
z-index class. Modal detection is heuristic, so it warns rather than blocks.

## require-card-component (warn)

Hand-rolled card containers (a `div` with radius + border/shadow + `bg-*`)
while `<Card>` exists — but only when the pattern repeats: **2+ candidates in a
file**. A single styled div is not evidence of a duplicated card system and is
never flagged.

## no-duplicate-components (warn)

Project-level rule on file names: `CustomButton.tsx`, `BaseModal.tsx`,
`AppInput.tsx`, `ButtonWrapper.tsx` duplicating an existing system component.
Deliberately prefix/suffix-restricted (`Custom|Primary|Secondary|Base|App|My|
New|Simple|Styled` + kind, or kind + `Component|Wrapper`): `IconButton.tsx` and
`SubmitButton.tsx` may be legitimate compositions, so they do **not** match.
Only fires when the duplicated system component actually exists.

## Shared guards

- **ui-dir exemption.** Files inside the design-system directory (e.g.
  `components/ui/`) are exempt from the `require-*` component rules and from
  no-duplicate-components — the system's own primitives are its implementation,
  not drift. The fixer also never touches ui-dir files.
- **fileExists gate.** Every `require-*` rule fires only when the mapped
  component's import resolves to a real file. Snapline never demands a
  component the project does not have.
- **Static-only extraction.** Class names come from string literals, template
  quasis, and string arguments of `cn()`/`clsx()`-style calls. Dynamic
  expressions are skipped, never guessed.

## False-positive policy

Errors must be high-confidence: a blocked agent on a wrong guess is worse than
missed drift. Warnings are advisory and never block. Heuristic rules (dialog,
card, duplicate names) are warnings by default and carry structural guards
(2+ repetition, explicit ARIA signals, restricted name patterns). When a rule
cannot be sure, it warns — or stays silent.

# Repair contracts

A repair contract is the unit Snapline hands back to an agent: one contract per
file with violations, with exact, ordered actions.

## Fields

```ts
interface RepairContract {
  schemaVersion: 1 // breaking contract changes require a new version
  title: string // "Repair UI drift in <file>"
  filePath: string // project-root-relative
  violations: Violation[] // full structured violations
  requiredActions: string[] // deduped instructions from error violations
  optionalActions: string[] // deduped instructions from warnings
  safeFixAvailable: boolean // true when `snapline fix --safe` can do part of it
  agentMessage: string // the rendered SNAPLINE FOUND UI DRIFT block
}
```

Each violation carries its own `repair`: an imperative `instruction`, a
`safeFix` flag, and — when the exact replacement is known — a `replacement`
string like `bg-primary`.

## The agent message format

Real output (golden snapshot from the test suite), abridged only in the middle:

```
SNAPLINE FOUND UI DRIFT

src/app/settings/billing/page.tsx

22 violations:
- [error] raw hex color: text-[#111827] (line 13)
- [error] inline style object: style={{ marginTop: "13px", color: "#6366f1" }} (line 7)
- [error] arbitrary value: text-[22px] (line 6)
- [warn] raw Tailwind color: text-gray-900 (line 6)
- [warn] raw Tailwind color: bg-blue-500 (line 10)
- [error] raw <button> used while <Button> exists (line 15)
- [error] raw <input> used while <Input> exists (line 18)
- [warn] custom card container while <Card> exists (line 8)
  ...

Repair:
- Replace text-[#111827] with a semantic token class from the theme (for example bg-primary, text-foreground, border-border). Raw hex values bypass the design system.
- Replace text-[22px] with text-xl (20px) if the value is still needed — arbitrary values bypass the design scale.
- Import Button from "@/components/ui/button" and replace the raw <button> with <Button>. Use variant props (variant="default" | "outline" | "ghost" | "destructive") instead of color classes.
- Import Input from "@/components/ui/input" and replace the raw <input> with <Input>. Drop hand-rolled border/focus classes — Input carries system styling.

Recommended:
- Replace text-gray-900 with text-foreground.
- Replace bg-blue-500 with bg-primary.
- Replace this container with Card and CardContent from "@/components/ui/card" (CardHeader/CardTitle for the heading region).
```

Structure: header, file path, a violation list with severity and line, then
`Repair:` (required) and `Recommended:` (optional). Multiple files produce
multiple contracts joined with `---` separators in one combined message.

## Design principles

- **Exact instructions, not vibes.** "Replace mt-[13px] with mt-3 (12px)"
  beats "follow the design system". The agent should be able to act without
  re-deriving intent — instructions name the class, the import path, and the
  component to use.
- **Required vs recommended maps to severity.** `Repair:` actions come from
  error violations and gate completion; `Recommended:` actions come from
  warnings and never block. Same split as the hook policy
  ([mental-model.md](mental-model.md)).
- **`safeFix` marks mechanical repairs.** A violation with `safeFix: true` can
  be applied by `snapline fix --safe` without judgment (exact scale match,
  unambiguous color mapping, simple element swap). Everything else is the
  agent's job — that division is the point of the tool.
- **Deterministic.** Contracts are grouped per file, files sorted, duplicate
  instructions deduped preserving order. Same scan, same message, byte for
  byte.

## How hooks embed contracts

The `agentMessage` travels inside the agent's native hook contract
([hooks.md](hooks.md)):

| Situation               | Where the contract goes                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| PostToolUse, errors     | `{"decision":"block","reason":<message>}`                                                                                             |
| PostToolUse, warns only | `hookSpecificOutput.additionalContext`                                                                                                |
| Stop, errors            | `{"decision":"block","reason":<message + "Fix the required actions above, then finish. Run \"snapline scan --changed\" to verify.">}` |
| Stop, warns only        | `hookSpecificOutput.additionalContext`                                                                                                |
| Codex                   | structured `decision: "block"` / `additionalContext` JSON on stdout                                                                   |
| Cursor                  | `additional_context` after tool use; `followup_message` at Stop                                                                       |

`snapline scan --json` exposes the same contracts programmatically.
The top-level scan result also includes `schemaVersion: 1`. Additive fields may
appear within version 1; fields are not removed or redefined until the schema
version changes. Consumers should ignore unknown fields and reject versions
they do not support.

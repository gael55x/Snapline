# Why Snapline exists

## The problem

Coding agents write plausible UI that is subtly off-system. The code compiles,
renders, and looks close enough to pass a glance — and drifts from your design
system in ways that compound:

- **Raw hex colors**: `text-[#6366f1]` instead of `text-primary`
- **Arbitrary values**: `mt-[13px]`, `w-[472px]` instead of scale tokens
- **Palette classes**: `bg-blue-500`, `text-gray-500` instead of semantic tokens
- **Raw primitives**: `<button className="...">` while `<Button>` exists
- **Duplicate components**: a fresh `CustomButton.tsx` next to your Button

Two structural reasons this keeps happening:

1. **Instructions decay with context.** A CLAUDE.md rule like "always use
   semantic tokens" competes with everything else in the window. Twenty edits
   into a session, it loses.
2. **Post-hoc review is too late.** By PR time the drift is woven into working
   code. A reviewer flags `bg-blue-500`; someone re-prompts; the agent redoes
   the work without the context it had when it wrote it.

## Why an edit-time hook

The moment the agent writes a file is the cheapest moment to fix it: the agent
still holds the full context, and the fix is a targeted edit rather than a
rework. Snapline's PostToolUse hook scans exactly the file that was edited and,
on error-severity drift, blocks with a [repair contract](repair-contracts.md) —
exact, per-violation instructions fed straight back into the agent loop. The
agent repairs its own output and moves on.

## Why a stop gate

Edit-time checks alone can be argued past or lost mid-session. The Stop hook is
the invariant: before the agent may finish, the entire git-changed set is
scanned. Errors block completion; the agent gets the combined contract and must
repair first. A loop guard ensures a stop that already retried once never blocks
again — see [hooks.md](hooks.md).

Instructions ask. Hooks verify. Snapline installs lifecycle hooks for Claude,
Codex, and Cursor; Codex and Cursor remain preview until the packed candidate
passes a recorded interactive workflow.

## Before and after

What an agent typically writes:

```tsx
<div className="rounded-[11px] border-zinc-200 bg-white p-6">
  <h2 className="text-[22px] text-gray-900">Billing</h2>
  <p className="text-gray-500" style={{ marginTop: "13px" }}>
    Manage your plan
  </p>
  <button className="bg-blue-500 text-white rounded px-4 py-2">Upgrade</button>
</div>
```

What the repair contract drives it to:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Billing</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="mt-3 text-muted-foreground">Manage your plan</p>
    <Button>Upgrade</Button>
  </CardContent>
</Card>
```

Same feature. The first version carries six drift violations; the second uses
the system's components and tokens, so a theme change or component update
propagates for free.

## Why deterministic

The scanner contains no LLM and makes no network calls. Rules are pure
functions over a TypeScript AST: the same file always produces the same
violations and the same instructions. That is what makes blocking acceptable —
an agent gate that guesses would be worse than no gate. When a rule cannot be
confident, it warns instead of blocking (see the false-positive policy in
[rules.md](rules.md)).

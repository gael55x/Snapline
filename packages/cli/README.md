# Snapline CLI

Keep AI-generated React/Tailwind UI on-system while coding agents edit it.

```sh
npm i -D @usesnapline/cli
npx snapline init --claude
npx snapline doctor claude
```

Snapline scans edited TSX/JSX, reports concrete design-system violations, and
returns repair contracts through Claude Code, Codex, or Cursor project hooks.
Claude is the supported integration; Codex and Cursor hooks are previews until
their interactive release checks are complete.

Requirements: Node.js 20+, Tailwind CSS, and git for changed-file/Stop scans.
Full documentation: https://github.com/gael55x/Snapline#readme

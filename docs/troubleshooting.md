# Troubleshooting

Start with the target-specific doctor:

```sh
npx snapline doctor claude   # or codex / cursor
```

It checks config, Tailwind discovery, component resolution, hook installation,
Node, git, and local state. Add `--debug` to a failing command for a stack
trace.

## `npx snapline` runs the wrong package

Install the scoped CLI first. The unscoped npm name belongs to an unrelated
package.

```sh
npm i -D @usesnapline/cli
npx snapline --version
```

## Tailwind is not detected

Snapline currently targets React/Tailwind source. Run `snapline init` from the
project root containing the Tailwind configuration. If a Tailwind v4 CSS-only
project is not discovered, that path is not yet supported; do not force a
passing doctor by inventing config.

## A configured component does not resolve

Check the `components.<Name>.import` path in `snapline.yml`, the project's
`tsconfig.json` or `jsconfig.json` aliases, and the actual `.tsx`, `.ts`, `.jsx`,
or index file. A missing component deliberately disables its `require-*` rule.
Use `components: {}` when the project has no component registry.

## Configuration fails

The first line of the error names the invalid key or value. The supported
top-level keys are `version`, `components`, `tokens`, and `rules`; unknown or
pre-1.0 no-op keys are rejected. Compare with [config.md](config.md).

## Hooks are installed but nothing happens

1. Run `npx snapline doctor <agent>`.
2. Restart the agent session; hook configuration is commonly loaded at start.
3. Confirm project trust/approval for the generated hook file.
4. Run `npx snapline scan path/to/file.tsx` directly.
5. Inspect agent debug output. Launcher/scanner failures are returned as
   non-blocking agent context rather than disappearing silently.

Codex and Cursor remain preview until the packed candidate has interactive
release evidence. A passing doctor proves installation, not live agent
behavior.

## Stop finds no changed files

Run from inside a git worktree and check `git status --short`. Snapline includes
tracked changes and untracked files, including repositories without a first
commit. Ignored files are intentionally excluded. `doctor <agent>` treats a
missing git worktree as blocking because Stop depends on it.

## A file cannot be scanned

Snapline accepts project-relative `.tsx` and `.jsx` paths. Absolute paths,
traversal, and symlinks outside the project are rejected. Syntax errors report
their file and location; Snapline will not return a misleading partial result.
Fully computed class expressions may be skipped and are a documented parser
limitation.

## The hook feels slow

PostToolUse scans only edited UI files and Stop scans the git-changed set. The
core itself is fast, but a fresh CLI process also loads Node and the TypeScript
parser. Compare your machine with [performance.md](performance.md). There is no
persistent cache or daemon in 1.0.

## Clean removal

```sh
npx snapline uninstall claude   # or codex / cursor
```

Uninstall removes only Snapline-owned entries and an unchanged Cursor rule. It
leaves unrelated hooks and user-edited rule files intact.

import path from "node:path"
import process from "node:process"
import { installClaudeHooks } from "@usesnapline/claude"
import { installCodex } from "@usesnapline/codex"
import { installCursor } from "@usesnapline/cursor"
import type { CliContext } from "../main.js"

/** `snapline install <claude|codex|cursor>` */
export function runInstall(ctx: CliContext): number {
  if (ctx.args.length !== 1) {
    process.stderr.write("Usage: snapline install <claude|codex|cursor>\n")
    return 1
  }
  const target = ctx.args[0]
  switch (target) {
    case "claude": {
      const result = installClaudeHooks(ctx.cwd)
      process.stdout.write(
        result.changed
          ? `✔ Claude hooks installed: ${path.relative(ctx.cwd, result.settingsPath)}\n  PostToolUse (Write|Edit|MultiEdit) -> snapline hook claude post-tool-use\n  Stop -> snapline hook claude stop\n`
          : "• Claude hooks already installed\n",
      )
      return 0
    }
    case "codex": {
      const result = installCodex(ctx.cwd)
      process.stdout.write(
        (result.changed
          ? `✔ Codex hooks installed: ${path.relative(ctx.cwd, result.hooksPath)}\n`
          : "• Codex hooks already installed\n") +
          "  Review and trust the project hooks with /hooks in Codex.\n",
      )
      return 0
    }
    case "cursor": {
      const result = installCursor(ctx.cwd)
      process.stdout.write(
        result.changed
          ? `✔ Cursor hooks installed: ${path.relative(ctx.cwd, result.hooksPath)}\n  Rule: ${path.relative(ctx.cwd, result.rulePath)}\n`
          : "• Cursor hooks and rule already installed\n",
      )
      return 0
    }
    default:
      process.stderr.write("Usage: snapline install <claude|codex|cursor>\n")
      return 1
  }
}

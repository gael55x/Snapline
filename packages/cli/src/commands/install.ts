import path from "node:path"
import process from "node:process"
import { installClaudeHooks } from "@usesnapline/claude"
import { installCodex } from "@usesnapline/codex"
import { installCursor } from "@usesnapline/cursor"
import type { CliContext } from "../main.js"

/** `snapline install <claude|codex|cursor>` */
export function runInstall(ctx: CliContext): number {
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
          ? `✔ Snapline section added to ${path.relative(ctx.cwd, result.agentsMdPath)}\n`
          : "• AGENTS.md already references Snapline\n") +
          "  Codex support is beta: Codex has no stable hook API yet, so enforcement is\n  instruction-level. See docs/codex.md for wiring events to snapline hook codex.\n",
      )
      return 0
    }
    case "cursor": {
      const result = installCursor(ctx.cwd)
      process.stdout.write(
        (result.changed
          ? `✔ Cursor rule written: ${path.relative(ctx.cwd, result.rulePath)}\n`
          : "• Cursor rule already present\n") +
          "  Cursor support is experimental (instruction-level). See docs/cursor.md.\n",
      )
      return 0
    }
    default:
      process.stderr.write("Usage: snapline install <claude|codex|cursor>\n")
      return 1
  }
}

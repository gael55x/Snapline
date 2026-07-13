import process from "node:process"
import { uninstallClaudeHooks } from "@usesnapline/claude"
import { uninstallCodex } from "@usesnapline/codex"
import { uninstallCursor } from "@usesnapline/cursor"
import type { CliContext } from "../main.js"

/** `snapline uninstall <claude|codex|cursor>` */
export function runUninstall(ctx: CliContext): number {
  if (ctx.args.length !== 1) {
    process.stderr.write("Usage: snapline uninstall <claude|codex|cursor>\n")
    return 1
  }
  const target = ctx.args[0]
  const changed =
    target === "claude"
      ? uninstallClaudeHooks(ctx.cwd).changed
      : target === "codex"
        ? uninstallCodex(ctx.cwd).changed
        : target === "cursor"
          ? uninstallCursor(ctx.cwd).changed
          : undefined
  if (changed === undefined) {
    process.stderr.write("Usage: snapline uninstall <claude|codex|cursor>\n")
    return 1
  }
  process.stdout.write(
    changed
      ? `✔ Snapline removed from ${target}\n`
      : `• Snapline was not installed for ${target}\n`,
  )
  return 0
}

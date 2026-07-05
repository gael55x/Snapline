import process from "node:process"
import { loadConfig, buildScanDeps, createFixPlan, applySafeFixes } from "@usesnapline/core"
import type { CliContext } from "../main.js"
import { performScan } from "./scan.js"

/** `snapline fix --safe [--dry-run]` — apply only mechanical, unambiguous fixes. */
export function runFix(ctx: CliContext): number {
  if (!ctx.flags.has("--safe")) {
    process.stderr.write(
      "snapline fix only supports --safe. Unsafe repairs are the agent's job — run snapline scan for the repair contract.\n",
    )
    return 1
  }
  const result = performScan(ctx)
  const { config } = loadConfig(ctx.cwd)
  const plan = createFixPlan(result, buildScanDeps(ctx.cwd, config))
  const dryRun = ctx.flags.has("--dry-run")
  const applied = applySafeFixes(ctx.cwd, plan, dryRun)
  if (applied.length === 0) {
    process.stdout.write("No safe fixes available.\n")
    return 0
  }
  for (const fix of applied) {
    process.stdout.write(`${dryRun ? "[dry-run] " : ""}${fix.filePath}\n`)
    for (const description of fix.descriptions) process.stdout.write(`  - ${description}\n`)
  }
  process.stdout.write(
    `${dryRun ? "Would fix" : "Fixed"} ${applied.length} file(s). Re-run snapline scan — remaining drift needs the agent (or you).\n`,
  )
  return 0
}

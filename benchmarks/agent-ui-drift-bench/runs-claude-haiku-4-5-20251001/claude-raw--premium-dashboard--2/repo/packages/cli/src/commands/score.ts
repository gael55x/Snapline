import process from "node:process"
import { scoreReport } from "@usesnapline/core"
import type { CliContext } from "../main.js"
import { performScan } from "./scan.js"

/** `snapline score [--json]` — drift score summary; exit 0 regardless of drift. */
export function runScore(ctx: CliContext): number {
  const result = performScan(ctx)
  if (ctx.flags.has("--json")) {
    process.stdout.write(JSON.stringify(result.score, null, 2) + "\n")
  } else {
    process.stdout.write(scoreReport(result) + "\n")
  }
  return 0
}

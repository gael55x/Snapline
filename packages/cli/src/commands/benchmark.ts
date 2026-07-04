import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"
import type { CliContext } from "../main.js"

function findBenchmarkRoot(start: string): string | undefined {
  let dir = start
  for (;;) {
    if (fs.existsSync(path.join(dir, "benchmarks", "agent-ui-drift-bench"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

/**
 * `snapline benchmark [graph]` — drives agent-ui-drift-bench. The harness
 * lives in the Snapline repository (it needs fixtures, prompts, and agent
 * CLIs), so this command locates it and delegates; outside the repo it points
 * at the docs instead of pretending to run something.
 */
export function runBenchmark(ctx: CliContext): number {
  const root = findBenchmarkRoot(ctx.cwd)
  if (root === undefined) {
    process.stdout.write(
      "agent-ui-drift-bench not found. The benchmark harness ships with the Snapline repository:\n" +
        "  git clone https://github.com/gael55x/Snapline\n" +
        "  pnpm install && pnpm bench:static\n" +
        "Methodology: docs/benchmark.md\n",
    )
    return 1
  }
  const script = ctx.args[0] === "graph" ? "bench:graph" : "bench:static"
  const result = spawnSync("pnpm", [script], { cwd: root, stdio: "inherit" })
  return result.status ?? 1
}

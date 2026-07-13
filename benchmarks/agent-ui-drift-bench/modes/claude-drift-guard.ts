import fs from "node:fs"
import path from "node:path"
import { claudeInvocation, type BenchMode } from "./types.js"
import { npmInstall, captureHelp } from "./shared.js"

/**
 * driftguard (npm: driftguard, "Deterministic design system compliance engine
 * for AI-generated UI"). Same reproducibility protocol as the Buoy mode.
 */
export const claudeDriftGuard: BenchMode = {
  id: "claude-drift-guard",
  agent: "claude",
  description: "Claude Code + driftguard; agent instructed to run its compliance check",
  prepare(fixtureDir) {
    npmInstall(fixtureDir, ["driftguard@0.1.1"])
    captureHelp(fixtureDir, "driftguard")
    fs.writeFileSync(
      path.join(fixtureDir, "CLAUDE.md"),
      `This project uses driftguard (design-system compliance). After editing UI files, run "npx driftguard --help" to see its check command, run the check, and fix everything it reports before finishing.\n`,
    )
  },
  invocation: claudeInvocation,
}

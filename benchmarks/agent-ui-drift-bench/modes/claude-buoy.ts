import fs from "node:fs"
import path from "node:path"
import { claudeInvocation, type BenchMode } from "./types.js"
import { npmInstall, captureHelp } from "./shared.js"

/**
 * Buoy (@buoy-design/cli, "Catch design drift before it ships"). The exact
 * check command follows the tool's own --help, captured into SETUP-NOTES.md at
 * setup time so runs stay reproducible against the installed version.
 */
export const claudeBuoy: BenchMode = {
  id: "claude-buoy",
  agent: "claude",
  description: "Claude Code + @buoy-design/cli; agent instructed to run Buoy's drift check",
  prepare(fixtureDir) {
    npmInstall(fixtureDir, ["@buoy-design/cli@0.3.38"])
    captureHelp(fixtureDir, "buoy")
    fs.writeFileSync(
      path.join(fixtureDir, "CLAUDE.md"),
      `This project uses Buoy (design drift detection). After editing UI files, run "npx buoy --help" to see its check command, run the drift check, and fix everything it reports before finishing.\n`,
    )
  },
  invocation: claudeInvocation,
}

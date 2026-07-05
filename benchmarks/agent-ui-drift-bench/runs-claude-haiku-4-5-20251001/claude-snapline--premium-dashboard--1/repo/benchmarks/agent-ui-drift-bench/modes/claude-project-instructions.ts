import { claudeInvocation, type BenchMode } from "./types.js"
import { writeClaudeMd } from "./shared.js"

/** Guidance-only: design-system rules in CLAUDE.md, no enforcement. */
export const claudeProjectInstructions: BenchMode = {
  id: "claude-project-instructions",
  agent: "claude",
  description: "Claude Code with design-system rules in CLAUDE.md (guidance, no enforcement)",
  prepare(fixtureDir) {
    writeClaudeMd(fixtureDir)
  },
  invocation: claudeInvocation,
}

import { claudeInvocation, type BenchMode } from "./types.js"
import { installSnapline } from "./shared.js"

/** Snapline: PostToolUse + Stop hooks enforce repair contracts. No CLAUDE.md guidance. */
export const claudeSnapline: BenchMode = {
  id: "claude-snapline",
  agent: "claude",
  description: "Claude Code + Snapline hooks (block-and-repair loop, no instruction file)",
  prepare(fixtureDir, repoRoot) {
    installSnapline(fixtureDir, repoRoot)
  },
  invocation: claudeInvocation,
}

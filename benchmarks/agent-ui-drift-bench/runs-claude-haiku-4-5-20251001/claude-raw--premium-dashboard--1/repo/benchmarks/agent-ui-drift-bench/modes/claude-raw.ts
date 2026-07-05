import { claudeInvocation, type BenchMode } from "./types.js"

/** Baseline: Claude with no guidance, no tooling. What agents do unaided. */
export const claudeRaw: BenchMode = {
  id: "claude-raw",
  agent: "claude",
  description: "Claude Code with no instructions or tooling (baseline)",
  prepare() {},
  invocation: claudeInvocation,
}

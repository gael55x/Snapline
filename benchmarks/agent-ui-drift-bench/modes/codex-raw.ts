import { codexInvocation, type BenchMode } from "./types.js"

/** Baseline: Codex with no guidance, no tooling. */
export const codexRaw: BenchMode = {
  id: "codex-raw",
  agent: "codex",
  description: "Codex CLI with no instructions or tooling (baseline)",
  prepare() {},
  invocation: codexInvocation,
}

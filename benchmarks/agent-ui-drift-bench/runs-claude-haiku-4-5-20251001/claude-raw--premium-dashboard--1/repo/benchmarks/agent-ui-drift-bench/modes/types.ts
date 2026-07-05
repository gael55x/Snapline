import type { BenchmarkMode } from "@usesnapline/contracts"

export interface AgentInvocation {
  readonly cmd: string
  readonly args: readonly string[]
  readonly env?: Readonly<Record<string, string>>
}

/**
 * One benchmark mode. prepare() sets up the mode's tooling inside a fresh
 * checkout's fixture directory and must throw with a precise reason when the
 * setup is not reproducible — that failure is recorded, never papered over.
 */
export interface BenchMode {
  readonly id: BenchmarkMode
  readonly agent: "claude"
  readonly description: string
  prepare(fixtureDir: string, repoRoot: string): void
  invocation(prompt: string, model: string): AgentInvocation
}

export function claudeInvocation(prompt: string, model: string): AgentInvocation {
  return {
    cmd: "claude",
    args: ["-p", prompt, "--model", model, "--permission-mode", "acceptEdits"],
  }
}

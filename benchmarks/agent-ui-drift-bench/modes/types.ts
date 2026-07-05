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
  readonly agent: "claude" | "codex"
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

export function codexInvocation(prompt: string, model: string): AgentInvocation {
  return {
    cmd: "codex",
    // Verified 2026-07-05 with codex-cli 0.142.5 help: `codex exec` is
    // non-interactive; `--sandbox workspace-write` permits cwd edits, and
    // `-c approval_policy="never"` prevents human approval prompts.
    args: [
      "exec",
      "--sandbox",
      "workspace-write",
      "-c",
      'approval_policy="never"',
      "--color",
      "never",
      "--model",
      model,
      prompt,
    ],
  }
}

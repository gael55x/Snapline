import type { Violation } from "./violation.js"

/**
 * A repair contract is the unit Snapline hands back to a coding agent.
 * One contract per file with violations. Actions are exact and ordered.
 */
export interface RepairContract {
  readonly title: string
  readonly filePath: string
  readonly violations: readonly Violation[]
  /** Must be done before the agent may finish (derived from error violations). */
  readonly requiredActions: readonly string[]
  /** Recommended but non-blocking (derived from warnings). */
  readonly optionalActions: readonly string[]
  /** True when at least one violation can be fixed by `snapline fix --safe`. */
  readonly safeFixAvailable: boolean
  /** The full agent-readable message (the `SNAPLINE FOUND UI DRIFT` block). */
  readonly agentMessage: string
}

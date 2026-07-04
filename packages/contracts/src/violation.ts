import type { RuleId, RuleSeverity } from "./rule.js"

export interface ViolationLocation {
  /** 1-based. */
  readonly line: number
  /** 1-based. */
  readonly column: number
  readonly endLine?: number
  readonly endColumn?: number
}

/** The exact repair the agent (or the safe fixer) should perform. */
export interface RepairInstruction {
  /** Imperative, specific instruction, e.g. `Replace mt-[13px] with mt-3 if spacing is needed`. */
  readonly instruction: string
  /** True when `snapline fix --safe` can apply this mechanically. */
  readonly safeFix: boolean
  /** Exact replacement text when known, e.g. `bg-primary` for `bg-blue-500`. */
  readonly replacement?: string
}

export interface Violation {
  /** Stable within a scan: `<ruleId>:<filePath>:<line>:<column>:<n>`. */
  readonly id: string
  readonly ruleId: RuleId
  readonly severity: Exclude<RuleSeverity, "off">
  /** Relative to the project root. */
  readonly filePath: string
  readonly message: string
  readonly location?: ViolationLocation
  /** The offending source snippet, e.g. `bg-blue-500` or `style={{ marginTop: "13px" }}`. */
  readonly evidence: string
  readonly repair: RepairInstruction
}

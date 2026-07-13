import type { RepairContract } from "./repair-contract.js"
import type { Violation } from "./violation.js"

export interface ScoreResult {
  /** ui-drift-score-v1. Lower is better; 0 is on-system. */
  readonly driftScore: number
  readonly totalViolations: number
  readonly errorViolations: number
  readonly warningViolations: number
  readonly rawHexValues: number
  readonly inlineStyleObjects: number
  readonly arbitraryTailwindValues: number
  readonly rawPaletteClasses: number
  /** Raw <button>/<input>/dialog/card primitives used where a system component exists. */
  readonly rawPrimitiveCount: number
  readonly duplicateComponentCount: number
  /** designSystemUses / (designSystemUses + rawPrimitiveUses); 1 when no UI elements found. */
  readonly componentReuseRate: number
}

export interface ScanResult {
  /** Public scan-result schema. Increment only for breaking shape/semantic changes. */
  readonly schemaVersion: 1
  /** Absolute project root the scan ran against. */
  readonly root: string
  /** Project-root-relative paths of files scanned. */
  readonly scannedFiles: readonly string[]
  readonly violations: readonly Violation[]
  readonly score: ScoreResult
  readonly contracts: readonly RepairContract[]
  readonly durationMs: number
}

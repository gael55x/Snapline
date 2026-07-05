import type { ScoreResult } from "./scan.js"

export type BenchmarkMode =
  | "claude-raw"
  | "claude-project-instructions"
  | "claude-shadcn-mcp"
  | "claude-tailwind-eslint"
  | "claude-buoy"
  | "claude-drift-guard"
  | "claude-snapline"
  | "claude-shadcn-mcp-snapline"
  | "codex-raw"
  | "codex-snapline"
  | "cursor-raw"
  | "cursor-snapline"

export interface BenchmarkRunResult {
  readonly score: ScoreResult
  readonly buildPass: boolean
  readonly typecheckPass: boolean
  /** Snapline repair round-trips the agent performed (0 for non-Snapline modes). */
  readonly repairIterations: number
  readonly hookRuntimeMs: number
  readonly totalWallTimeSeconds: number
  readonly filesTouched: number
  /** Set when the run could not complete; result metrics are then absent from aggregates. */
  readonly failure?: string
}

export interface BenchmarkRun {
  readonly id: string
  /** ISO 8601. */
  readonly timestamp: string
  readonly mode: BenchmarkMode
  readonly fixture: string
  readonly promptId: string
  /** 1-based attempt number for this (mode, fixture, prompt) triple. */
  readonly attempt: number
  readonly model: string
  readonly agent: "claude" | "codex" | "cursor"
  readonly result: BenchmarkRunResult
  readonly rawOutputPaths: readonly string[]
  readonly scannerJsonPath: string
  readonly gitDiffPath: string
}

export interface BenchmarkModeSummary {
  readonly mode: BenchmarkMode
  readonly runs: number
  readonly failures: number
  /** Medians across successful runs. Absent when no successful runs exist — never fabricated. */
  readonly median?: {
    readonly driftScore: number
    readonly totalViolations: number
    readonly componentReuseRate: number
    readonly buildPassRate: number
    readonly repairIterations: number
    readonly totalWallTimeSeconds: number
  }
}

export interface BenchmarkReport {
  readonly benchmark: "agent-ui-drift-bench"
  readonly generatedAt: string
  /** SHA-256 of benchmark.config.json — ties a report to its exact configuration. */
  readonly configHash: string
  readonly scorer: "ui-drift-score-v1"
  readonly modes: readonly BenchmarkModeSummary[]
  readonly runs: readonly BenchmarkRun[]
}

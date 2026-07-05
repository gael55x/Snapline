import process from "node:process"
import {
  loadConfig,
  scanProject,
  scanFiles,
  buildScanDeps,
  gitChangedFiles,
  isScannableFile,
  humanReport,
  jsonReport,
} from "@usesnapline/core"
import type { ScanResult } from "@usesnapline/contracts"
import type { CliContext } from "../main.js"

export function performScan(ctx: CliContext): ScanResult {
  const { config } = loadConfig(ctx.cwd)
  if (ctx.flags.has("--changed")) {
    const files = gitChangedFiles(ctx.cwd).filter(isScannableFile)
    return scanFiles(ctx.cwd, files, buildScanDeps(ctx.cwd, config))
  }
  return scanProject(ctx.cwd, config)
}

/** `snapline scan [--changed] [--json]` — exit 1 on error violations. */
export function runScan(ctx: CliContext): number {
  const result = performScan(ctx)
  process.stdout.write((ctx.flags.has("--json") ? jsonReport(result) : humanReport(result)) + "\n")
  return result.score.errorViolations > 0 ? 1 : 0
}

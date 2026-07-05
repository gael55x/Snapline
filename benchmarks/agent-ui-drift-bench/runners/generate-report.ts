/**
 * Aggregate runs/<id>/run.json into reports/latest.{json,md,csv}.
 * Medians only, never means-of-cherry-picked; failed runs count as failures
 * and are excluded from medians but reported in the failure column.
 */
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import type {
  BenchmarkMode,
  BenchmarkModeSummary,
  BenchmarkReport,
  BenchmarkRun,
} from "@usesnapline/contracts"
import { loadBenchConfig, benchRoot } from "./config.js"

export function median(values: readonly number[]): number {
  if (values.length === 0) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export function collectRuns(runsDirName = "runs"): BenchmarkRun[] {
  const runsDir = path.join(benchRoot, runsDirName)
  if (!fs.existsSync(runsDir)) return []
  const runs: BenchmarkRun[] = []
  for (const entry of fs.readdirSync(runsDir).sort()) {
    const file = path.join(runsDir, entry, "run.json")
    if (fs.existsSync(file)) runs.push(JSON.parse(fs.readFileSync(file, "utf8")) as BenchmarkRun)
  }
  return runs
}

export function summarizeMode(
  mode: BenchmarkMode,
  runs: readonly BenchmarkRun[],
): BenchmarkModeSummary {
  const modeRuns = runs.filter((r) => r.mode === mode)
  const ok = modeRuns.filter((r) => r.result.failure === undefined)
  const failures = modeRuns.length - ok.length
  if (ok.length === 0) return { mode, runs: modeRuns.length, failures }
  const scores = ok.map((r) => r.result.score.driftScore)
  return {
    mode,
    runs: modeRuns.length,
    failures,
    median: {
      driftScore: median(scores),
      totalViolations: median(ok.map((r) => r.result.score.totalViolations)),
      componentReuseRate: median(ok.map((r) => r.result.score.componentReuseRate)),
      buildPassRate: ok.filter((r) => r.result.buildPass).length / ok.length,
      repairIterations: median(ok.map((r) => r.result.repairIterations)),
      totalWallTimeSeconds: median(ok.map((r) => r.result.totalWallTimeSeconds)),
    },
    driftedRunRate: scores.filter((s) => s > 0).length / scores.length,
    worstDriftScore: Math.max(...scores),
  }
}

export function buildReport(runs: readonly BenchmarkRun[]): BenchmarkReport {
  const { config, configHash } = loadBenchConfig()
  const generatedAt =
    runs.length > 0 ? [...runs.map((r) => r.timestamp)].sort().at(-1)! : "no runs recorded"
  return {
    benchmark: "agent-ui-drift-bench",
    generatedAt,
    configHash,
    scorer: "ui-drift-score-v1",
    modes: config.modes.map((m) => summarizeMode(m as BenchmarkMode, runs)),
    runs,
  }
}

function fmt(n: number | undefined, digits = 1): string {
  return n === undefined || Number.isNaN(n) ? "TBD" : n.toFixed(digits)
}

export function reportMarkdown(report: BenchmarkReport): string {
  const lines = [
    "# agent-ui-drift-bench — latest report",
    "",
    `- generated: ${report.generatedAt}`,
    `- config hash: ${report.configHash}`,
    `- scorer: ${report.scorer}`,
    `- total runs: ${report.runs.length}`,
    "",
    "| mode | runs | failures | drifted runs | worst drift | drift score (median) | component reuse (median) | build pass | wall time (s) |",
    "|---|---|---|---|---|---|---|---|---|",
  ]
  for (const summary of report.modes) {
    const m = summary.median
    const rate =
      summary.driftedRunRate !== undefined
        ? `${(summary.driftedRunRate * 100).toFixed(0)}%`
        : "TBD"
    lines.push(
      `| ${summary.mode} | ${summary.runs} | ${summary.failures} | ${rate} | ${fmt(summary.worstDriftScore, 0)} | ${fmt(m?.driftScore)} | ${m ? (m.componentReuseRate * 100).toFixed(1) + "%" : "TBD"} | ${m ? (m.buildPassRate * 100).toFixed(0) + "%" : "TBD"} | ${fmt(m?.totalWallTimeSeconds, 0)} |`,
    )
  }
  lines.push(
    "",
    "TBD = no successful runs recorded for this mode yet. Values are never fabricated.",
  )
  return lines.join("\n") + "\n"
}

export function reportCsv(report: BenchmarkReport): string {
  const header =
    "mode,runs,failures,driftedRunRate,worstDriftScore,driftScoreMedian,totalViolationsMedian,componentReuseRateMedian,buildPassRate,repairIterationsMedian,totalWallTimeSecondsMedian"
  const rows = report.modes.map((s) => {
    const m = s.median
    return [
      s.mode,
      s.runs,
      s.failures,
      s.driftedRunRate ?? "",
      s.worstDriftScore ?? "",
      m?.driftScore ?? "",
      m?.totalViolations ?? "",
      m?.componentReuseRate ?? "",
      m?.buildPassRate ?? "",
      m?.repairIterations ?? "",
      m?.totalWallTimeSeconds ?? "",
    ].join(",")
  })
  return [header, ...rows].join("\n") + "\n"
}

export function writeReports(report: BenchmarkReport, name = "latest"): void {
  const reportsDir = path.join(benchRoot, "reports")
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(path.join(reportsDir, `${name}.json`), JSON.stringify(report, null, 2) + "\n")
  fs.writeFileSync(path.join(reportsDir, `${name}.md`), reportMarkdown(report))
  fs.writeFileSync(path.join(reportsDir, `${name}.csv`), reportCsv(report))
}

const isMain =
  process.argv[1] !== undefined && import.meta.url.endsWith(path.basename(process.argv[1]))
if (isMain) {
  // --runs-dir runs-<model> --name <report-name> for cross-model slices.
  const argv = process.argv.slice(2)
  const flag = (n: string): string | undefined => {
    const i = argv.indexOf(n)
    return i !== -1 ? argv[i + 1] : undefined
  }
  const runsDir = flag("--runs-dir") ?? "runs"
  const name = flag("--name") ?? "latest"
  const report = buildReport(collectRuns(runsDir))
  writeReports(report, name)
  process.stdout.write(`reports/${name}.{json,md,csv} written (${report.runs.length} runs from ${runsDir}/)\n`)
}

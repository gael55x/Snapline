/**
 * Deterministic SVG bar charts from reports/latest.json. No charting service,
 * no randomness: same report in, same bytes out. Modes without successful runs
 * render as hatched TBD bars — never fabricated values.
 */
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import type { BenchmarkReport } from "@usesnapline/contracts"
import { benchRoot, loadBenchConfig } from "./config.js"

export interface Bar {
  readonly label: string
  /** null renders as TBD. */
  readonly value: number | null
  readonly highlight?: boolean
}

const WIDTH = 760
const BAR_HEIGHT = 26
const GAP = 10
const LABEL_WIDTH = 230
const MARGIN = 16

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function svgBarChart(
  title: string,
  subtitle: string,
  bars: readonly Bar[],
  format: (v: number) => string = (v) => v.toFixed(1),
): string {
  const max = Math.max(1, ...bars.map((b) => b.value ?? 0))
  const chartWidth = WIDTH - LABEL_WIDTH - MARGIN * 2 - 70
  const height = MARGIN * 2 + 44 + bars.length * (BAR_HEIGHT + GAP)
  const rows = bars.map((bar, i) => {
    const y = MARGIN + 44 + i * (BAR_HEIGHT + GAP)
    const labelText = `<text x="${LABEL_WIDTH - 8}" y="${y + BAR_HEIGHT / 2 + 4}" text-anchor="end" font-size="12" fill="#333" font-family="ui-monospace, monospace">${esc(bar.label)}</text>`
    if (bar.value === null) {
      return `${labelText}
  <rect x="${LABEL_WIDTH}" y="${y}" width="${chartWidth}" height="${BAR_HEIGHT}" fill="url(#tbd)" opacity="0.35" rx="3"/>
  <text x="${LABEL_WIDTH + 8}" y="${y + BAR_HEIGHT / 2 + 4}" font-size="12" fill="#888" font-family="ui-monospace, monospace">TBD — no runs recorded</text>`
    }
    const w = Math.max(2, Math.round((bar.value / max) * chartWidth))
    const fill = bar.highlight === true ? "#0f766e" : "#64748b"
    return `${labelText}
  <rect x="${LABEL_WIDTH}" y="${y}" width="${w}" height="${BAR_HEIGHT}" fill="${fill}" rx="3"/>
  <text x="${LABEL_WIDTH + w + 8}" y="${y + BAR_HEIGHT / 2 + 4}" font-size="12" fill="#333" font-family="ui-monospace, monospace">${esc(format(bar.value))}</text>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${esc(title)}">
  <defs>
    <pattern id="tbd" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#e2e8f0"/><line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${height}" fill="#ffffff"/>
  <text x="${MARGIN}" y="${MARGIN + 12}" font-size="15" font-weight="bold" fill="#111" font-family="ui-sans-serif, system-ui">${esc(title)}</text>
  <text x="${MARGIN}" y="${MARGIN + 30}" font-size="11" fill="#666" font-family="ui-sans-serif, system-ui">${esc(subtitle)}</text>
  ${rows.join("\n  ")}
</svg>
`
}

function loadReport(name = "latest"): BenchmarkReport | undefined {
  const file = path.join(benchRoot, "reports", `${name}.json`)
  if (!fs.existsSync(file)) return undefined
  return JSON.parse(fs.readFileSync(file, "utf8")) as BenchmarkReport
}

/**
 * Cross-model/cross-agent chart: raw vs Snapline drifted-run rate per slice,
 * built only from slice reports that exist. Codex is labeled instruction-level
 * — no hook gate exists for Codex.
 */
function crossSliceChart(): string | undefined {
  const slices: ReadonlyArray<{
    report: string
    label: string
    rawMode: string
    gatedMode: string
    gatedLabel: string
  }> = [
    { report: "latest", label: "Claude Sonnet 5", rawMode: "claude-raw", gatedMode: "claude-snapline", gatedLabel: "snapline (hook gate)" },
    { report: "latest-haiku", label: "Claude Haiku 4.5", rawMode: "claude-raw", gatedMode: "claude-snapline", gatedLabel: "snapline (hook gate)" },
    { report: "latest-codex", label: "Codex gpt-5.5", rawMode: "codex-raw", gatedMode: "codex-snapline", gatedLabel: "snapline (instructions only)" },
  ]
  const bars: Bar[] = []
  let totalRuns = 0
  for (const slice of slices) {
    const report = loadReport(slice.report)
    if (report === undefined || report.runs.length === 0) continue
    const raw = report.modes.find((m) => m.mode === slice.rawMode)
    const gated = report.modes.find((m) => m.mode === slice.gatedMode)
    if (raw?.driftedRunRate === undefined || gated?.driftedRunRate === undefined) continue
    totalRuns += report.runs.length
    bars.push({ label: `${slice.label} — raw`, value: raw.driftedRunRate })
    bars.push({ label: `${slice.label} — ${slice.gatedLabel}`, value: gated.driftedRunRate, highlight: true })
  }
  if (bars.length === 0) return undefined
  return svgBarChart(
    "Drifted runs by model/agent — raw vs Snapline (lower is better)",
    `agent-ui-drift-bench · ${totalRuns} runs across slices · full reports in reports/`,
    bars,
    (v) => `${(v * 100).toFixed(0)}%`,
  )
}

export function generateGraphs(): string[] {
  const { config, configHash } = loadBenchConfig()
  const report = loadReport()
  const models =
    report !== undefined ? [...new Set(report.runs.map((r) => r.model))].sort().join(", ") : ""
  const subtitle =
    report !== undefined && report.runs.length > 0
      ? `agent-ui-drift-bench · ${report.runs.length} runs · ${models} · generated ${report.generatedAt} · config ${report.configHash}`
      : `agent-ui-drift-bench · no runs recorded yet · config ${configHash} · run "pnpm bench:agent -- --all"`

  const summaries = config.modes.map((mode) => ({
    mode,
    summary: report?.modes.find((m) => m.mode === mode),
  }))
  const bar = (value: number | undefined | null, mode: string): Bar => ({
    label: mode,
    value: value ?? null,
    highlight: mode.includes("snapline"),
  })

  const charts: ReadonlyArray<{ file: string; svg: string }> = [
    {
      file: "drift-rate.svg",
      svg: svgBarChart(
        "Drifted runs — share of runs with any UI drift (lower is better)",
        subtitle,
        summaries.map((s) => bar(s.summary?.driftedRunRate, s.mode)),
        (v) => `${(v * 100).toFixed(0)}%`,
      ),
    },
    {
      file: "drift-score.svg",
      svg: svgBarChart(
        "UI drift score (median, lower is better)",
        subtitle,
        summaries.map((s) => bar(s.summary?.median?.driftScore, s.mode)),
      ),
    },
    {
      file: "component-reuse.svg",
      svg: svgBarChart(
        "Component reuse rate (median, higher is better)",
        subtitle,
        summaries.map((s) => bar(s.summary?.median?.componentReuseRate, s.mode)),
        (v) => `${(v * 100).toFixed(1)}%`,
      ),
    },
    {
      file: "build-pass.svg",
      svg: svgBarChart(
        "Build pass rate (higher is better)",
        subtitle,
        summaries.map((s) => bar(s.summary?.median?.buildPassRate, s.mode)),
        (v) => `${(v * 100).toFixed(0)}%`,
      ),
    },
    {
      file: "repair-iterations.svg",
      svg: svgBarChart(
        "Snapline repair iterations (median)",
        subtitle,
        summaries.map((s) => bar(s.summary?.median?.repairIterations, s.mode)),
      ),
    },
  ]
  const graphsDir = path.join(benchRoot, "graphs")
  fs.mkdirSync(graphsDir, { recursive: true })
  const written: string[] = []
  for (const chart of charts) {
    fs.writeFileSync(path.join(graphsDir, chart.file), chart.svg)
    written.push(chart.file)
  }
  const cross = crossSliceChart()
  if (cross !== undefined) {
    fs.writeFileSync(path.join(graphsDir, "cross-model-drift-rate.svg"), cross)
    written.push("cross-model-drift-rate.svg")
  }
  return written
}

const isMain =
  process.argv[1] !== undefined && import.meta.url.endsWith(path.basename(process.argv[1]))
if (isMain) {
  const files = generateGraphs()
  process.stdout.write(`graphs written: ${files.join(", ")}\n`)
}

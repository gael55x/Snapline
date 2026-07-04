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

function loadReport(): BenchmarkReport | undefined {
  const file = path.join(benchRoot, "reports", "latest.json")
  if (!fs.existsSync(file)) return undefined
  return JSON.parse(fs.readFileSync(file, "utf8")) as BenchmarkReport
}

export function generateGraphs(): string[] {
  const { config, configHash } = loadBenchConfig()
  const report = loadReport()
  const subtitle =
    report !== undefined && report.runs.length > 0
      ? `agent-ui-drift-bench · ${report.runs.length} runs · generated ${report.generatedAt} · config ${report.configHash} · median, lower is better`
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
  return written
}

const isMain =
  process.argv[1] !== undefined && import.meta.url.endsWith(path.basename(process.argv[1]))
if (isMain) {
  const files = generateGraphs()
  process.stdout.write(`graphs written: ${files.join(", ")}\n`)
}

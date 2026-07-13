import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const { buildScanDeps, jsonReport, loadConfig, scanFiles, scanProject } = await import(
  pathToFileURL(path.join(root, "packages/core/dist/index.js"))
)

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]
}

function measure(name, iterations, operation, warmups = 1) {
  for (let index = 0; index < warmups; index++) operation()
  const durations = []
  let lastResult
  for (let index = 0; index < iterations; index++) {
    const started = performance.now()
    lastResult = operation()
    durations.push(performance.now() - started)
  }
  return {
    name,
    iterations,
    p50Ms: Number(percentile(durations, 0.5).toFixed(3)),
    p95Ms: Number(percentile(durations, 0.95).toFixed(3)),
    minMs: Number(Math.min(...durations).toFixed(3)),
    maxMs: Number(Math.max(...durations).toFixed(3)),
    scannedFiles: lastResult?.scannedFiles?.length,
    outputBytes: lastResult === undefined ? undefined : Buffer.byteLength(jsonReport(lastResult)),
  }
}

function syntheticProject(parent, name, fileCount) {
  const project = path.join(parent, name)
  fs.mkdirSync(path.join(project, "src"), { recursive: true })
  fs.writeFileSync(path.join(project, "tailwind.config.js"), "export default {}\n")
  fs.writeFileSync(
    path.join(project, "snapline.yml"),
    "version: 1\nstack: { framework: other, ui: custom, styling: tailwind }\ncomponents: {}\n",
  )
  for (let index = 0; index < fileCount; index++) {
    fs.writeFileSync(
      path.join(project, "src", `file-${index}.tsx`),
      `export const View${index} = () => <section className="text-foreground p-4">View ${index}</section>\n`,
    )
  }
  return project
}

function graph(result) {
  const width = 900
  const rowHeight = 42
  const labelWidth = 260
  const chartWidth = 520
  const height = 80 + result.scenarios.length * rowHeight
  const max = Math.max(...result.scenarios.map((scenario) => scenario.p95Ms), 1)
  const rows = result.scenarios
    .map((scenario, index) => {
      const y = 60 + index * rowHeight
      const p50Width = Math.max(2, Math.round((scenario.p50Ms / max) * chartWidth))
      const p95Width = Math.max(2, Math.round((scenario.p95Ms / max) * chartWidth))
      return `<text x="${labelWidth - 10}" y="${y + 16}" text-anchor="end" font-size="12" font-family="ui-monospace,monospace">${scenario.name}</text>
<rect x="${labelWidth}" y="${y}" width="${p95Width}" height="12" rx="2" fill="#94a3b8"/>
<rect x="${labelWidth}" y="${y + 15}" width="${p50Width}" height="12" rx="2" fill="#0f766e"/>
<text x="${labelWidth + p95Width + 8}" y="${y + 11}" font-size="11" font-family="ui-monospace,monospace">p95 ${scenario.p95Ms}ms</text>
<text x="${labelWidth + p50Width + 8}" y="${y + 26}" font-size="11" font-family="ui-monospace,monospace">p50 ${scenario.p50Ms}ms</text>`
    })
    .join("\n")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Snapline scan latency">
<rect width="${width}" height="${height}" fill="white"/>
<text x="16" y="24" font-size="16" font-weight="bold">Snapline scan latency</text>
<text x="16" y="43" font-size="11">${result.environment.platform} ${result.environment.arch} · Node ${result.environment.nodeVersion} · ${result.environment.cpu}</text>
${rows}
</svg>\n`
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-performance-"))
try {
  const medium = syntheticProject(temporary, "medium", 100)
  const large = syntheticProject(temporary, "large", 1000)
  const small = path.join(root, "fixtures", "next-shadcn-dashboard-app")
  const singleConfig = loadConfig(medium).config
  const singleDeps = buildScanDeps(medium, singleConfig)
  const cli = path.join(root, "packages", "cli", "dist", "main.js")

  const scenarios = [
    measure("core_single_file", 50, () => scanFiles(medium, ["src/file-0.tsx"], singleDeps)),
    measure("core_small_project", 20, () => scanProject(small, loadConfig(small).config)),
    measure("core_medium_100_files", 10, () => scanProject(medium, loadConfig(medium).config)),
    measure("core_large_1000_files", 5, () => scanProject(large, loadConfig(large).config)),
    measure("core_no_change_rerun_1000_files", 5, () =>
      scanProject(large, loadConfig(large).config),
    ),
    measure("core_incremental_one_of_1000", 50, () =>
      scanFiles(large, ["src/file-999.tsx"], buildScanDeps(large, loadConfig(large).config)),
    ),
    measure(
      "cli_cold_start_single_file",
      7,
      () => {
        const run = spawnSync(process.execPath, [cli, "scan", "src/file-0.tsx", "--json"], {
          cwd: medium,
          encoding: "utf8",
        })
        if (run.status !== 0) throw new Error(run.stderr || `CLI exited ${run.status}`)
        return JSON.parse(run.stdout)
      },
      0,
    ),
  ]

  const result = {
    benchmark: "snapline-performance-v1",
    generatedAt: new Date().toISOString(),
    sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    environment: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCores: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      maxRssKb: process.resourceUsage().maxRSS,
    },
    methodology: {
      timing: "performance.now wall time in one process; CLI scenario spawns a fresh Node process",
      fixtures: [
        "fixtures/next-shadcn-dashboard-app",
        "generated clean 100-file TSX project",
        "generated clean 1000-file TSX project",
      ],
      cache: "Snapline has no persistent or in-process scan cache",
    },
    scenarios,
  }

  const resultsDir = path.join(root, "benchmarks", "performance", "results")
  const graphsDir = path.join(root, "benchmarks", "performance", "graphs")
  fs.mkdirSync(resultsDir, { recursive: true })
  fs.mkdirSync(graphsDir, { recursive: true })
  const resultPath = path.join(resultsDir, "latest.json")
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n")
  const recorded = JSON.parse(fs.readFileSync(resultPath, "utf8"))
  fs.writeFileSync(path.join(graphsDir, "latency.svg"), graph(recorded))
  process.stdout.write(
    `${path.relative(root, resultPath)} written (${scenarios.length} scenarios)\n`,
  )
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}

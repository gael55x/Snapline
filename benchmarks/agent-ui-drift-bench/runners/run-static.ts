/**
 * Static benchmark harness (CI-safe, no agents, no API):
 *   1. Fixture baseline — the three fixture apps must scan clean (drift 0).
 *   2. Scorer validation — the committed drifted sample must produce the exact
 *      expected metric counts, twice, byte-identical (determinism gate).
 *   3. Pipeline exercise — render a report in memory and regenerate graphs
 *      from the committed report. Archive consistency has its own gate.
 *
 * This validates the measurement pipeline. It is NOT a mode comparison and
 * writes reports/static-validation.json, never reports/latest.json.
 */
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { defaultConfig, scanProject } from "@usesnapline/core"
import { benchRoot, repoRoot, loadBenchConfig } from "./config.js"
import { buildReport, collectRuns, reportCsv, reportMarkdown } from "./generate-report.js"
import { generateGraphs } from "./generate-graphs.js"

/** Golden metrics for samples/drifted-app. Update deliberately when rules change. */
const EXPECTED_SAMPLE_SCORE = {
  driftScore: 171,
  totalViolations: 29,
  errorViolations: 11,
  warningViolations: 18,
  rawHexValues: 2,
  inlineStyleObjects: 2,
  arbitraryTailwindValues: 5,
  rawPaletteClasses: 13,
  rawPrimitiveCount: 6,
  duplicateComponentCount: 1,
} as const

function fail(message: string): never {
  process.stderr.write(`✖ ${message}\n`)
  process.exit(1)
}

function main(): void {
  const { config } = loadBenchConfig()

  // 1. fixture baselines
  for (const fixture of config.fixtures) {
    const result = scanProject(path.join(repoRoot, "fixtures", fixture), defaultConfig())
    if (result.score.driftScore !== 0) {
      fail(
        `fixture ${fixture} is not clean (drift ${result.score.driftScore}) — fixtures are the zero baseline`,
      )
    }
    process.stdout.write(
      `✔ fixture ${fixture}: clean (${result.scannedFiles.length} files, ${result.durationMs}ms)\n`,
    )
  }

  // 2. scorer validation + determinism
  const sampleDir = path.join(benchRoot, "samples", "drifted-app")
  const first = scanProject(sampleDir, defaultConfig())
  const second = scanProject(sampleDir, defaultConfig())
  if (JSON.stringify(first.violations) !== JSON.stringify(second.violations)) {
    fail("scanner is non-deterministic on samples/drifted-app")
  }
  for (const [key, expected] of Object.entries(EXPECTED_SAMPLE_SCORE)) {
    const actual = first.score[key as keyof typeof first.score]
    if (actual !== expected) {
      fail(
        `samples/drifted-app ${key}: expected ${expected}, got ${actual} — rules changed; update golden metrics deliberately`,
      )
    }
  }
  process.stdout.write(
    `✔ drifted sample: drift ${first.score.driftScore}, ${first.score.totalViolations} violations, deterministic, golden metrics match\n`,
  )
  fs.mkdirSync(path.join(benchRoot, "reports"), { recursive: true })
  fs.writeFileSync(
    path.join(benchRoot, "reports", "static-validation.json"),
    JSON.stringify(
      {
        note: "Scanner pipeline validation on committed synthetic samples. NOT an agent mode comparison.",
        sample: "samples/drifted-app",
        score: first.score,
        deterministic: true,
      },
      null,
      2,
    ) + "\n",
  )

  // 3. exercise report formatting without overwriting published evidence
  const runs = collectRuns()
  const report = buildReport(runs)
  JSON.stringify(report)
  reportMarkdown(report)
  reportCsv(report)
  const graphs = generateGraphs()
  process.stdout.write(
    `✔ report + graphs regenerated (${runs.length} agent runs recorded): ${graphs.join(", ")}\n`,
  )
  process.stdout.write("Static harness passed.\n")
}

main()

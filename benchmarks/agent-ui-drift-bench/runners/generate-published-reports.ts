import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import { benchRoot } from "./config.js"
import {
  buildReport,
  collectRuns,
  reportCsv,
  reportMarkdown,
  writeReports,
} from "./generate-report.js"
import { generateGraphs } from "./generate-graphs.js"

const SLICES = [
  { runsDir: "runs-data", report: "latest" },
  { runsDir: "runs-data-haiku", report: "latest-haiku" },
  { runsDir: "runs-data-codex", report: "latest-codex" },
] as const

function expectedFiles(reportName: string, runsDir: string): Record<string, string> {
  const report = buildReport(collectRuns(runsDir))
  return {
    [`${reportName}.json`]: JSON.stringify(report, null, 2) + "\n",
    [`${reportName}.md`]: reportMarkdown(report),
    [`${reportName}.csv`]: reportCsv(report),
  }
}

function checkFile(file: string, expected: string, errors: string[]): void {
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== expected) {
    errors.push(path.relative(benchRoot, file))
  }
}

function main(): void {
  const check = process.argv.includes("--check")
  const errors: string[] = []
  for (const slice of SLICES) {
    const report = buildReport(collectRuns(slice.runsDir))
    if (check) {
      for (const [name, expected] of Object.entries(expectedFiles(slice.report, slice.runsDir))) {
        checkFile(path.join(benchRoot, "reports", name), expected, errors)
      }
    } else {
      writeReports(report, slice.report)
    }
  }

  if (check) {
    const temporaryGraphs = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-graphs-"))
    try {
      for (const name of generateGraphs(temporaryGraphs)) {
        checkFile(
          path.join(benchRoot, "graphs", name),
          fs.readFileSync(path.join(temporaryGraphs, name), "utf8"),
          errors,
        )
      }
    } finally {
      fs.rmSync(temporaryGraphs, { recursive: true, force: true })
    }
    if (errors.length > 0) {
      process.stderr.write(
        `Published benchmark artifacts are stale:\n${errors.map((file) => `- ${file}`).join("\n")}\nRun pnpm bench:report:published.\n`,
      )
      process.exit(1)
    }
    process.stdout.write("Published benchmark reports and graphs match committed raw data.\n")
    return
  }

  const graphs = generateGraphs()
  process.stdout.write(`Published reports and graphs written: ${graphs.join(", ")}\n`)
}

main()

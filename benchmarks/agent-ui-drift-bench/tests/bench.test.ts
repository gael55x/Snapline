import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import type { BenchmarkRun } from "@usesnapline/contracts"
import { defaultConfig, scanProject } from "@usesnapline/core"
import { median, summarizeMode, reportMarkdown, buildReport } from "../runners/generate-report.js"
import { svgBarChart } from "../runners/generate-graphs.js"
import { loadPrompt, listPromptIds } from "../runners/config.js"
import { resolveMode, ALL_MODES } from "../runners/run-mode.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const benchRoot = path.join(here, "..")
const repoRoot = path.join(benchRoot, "..", "..")

/** Real scanner output on committed inputs — never invented numbers. */
function runFromScan(mode: BenchmarkRun["mode"], dir: string, attempt: number): BenchmarkRun {
  const scan = scanProject(dir, defaultConfig())
  return {
    id: `${mode}--smoke--${attempt}`,
    timestamp: "2026-01-01T00:00:00.000Z",
    mode,
    fixture: "smoke",
    promptId: "smoke",
    attempt,
    model: "none (static smoke)",
    agent: "claude",
    result: {
      score: scan.score,
      buildPass: true,
      typecheckPass: true,
      repairIterations: 0,
      hookRuntimeMs: 0,
      totalWallTimeSeconds: 0,
      filesTouched: scan.scannedFiles.length,
    },
    rawOutputPaths: [],
    scannerJsonPath: "",
    gitDiffPath: "",
  }
}

describe("prompts", () => {
  it("has at least 30 prompts, all parseable with valid fixtures", () => {
    const ids = listPromptIds()
    expect(ids.length).toBeGreaterThanOrEqual(30)
    const fixtures = new Set([
      "next-shadcn-basic",
      "next-shadcn-custom-theme",
      "next-shadcn-dashboard-app",
    ])
    for (const id of ids) {
      const prompt = loadPrompt(id)
      expect(prompt.body.length, `${id} body`).toBeGreaterThan(40)
      expect(fixtures.has(prompt.fixture), `${id} fixture ${prompt.fixture}`).toBe(true)
      const lower = prompt.body.toLowerCase()
      // Prompt design: no system hints — that's what the benchmark measures.
      for (const banned of ["shadcn", "semantic token", "design system", "design-system"]) {
        expect(lower.includes(banned), `${id} must not hint "${banned}"`).toBe(false)
      }
    }
  })
})

describe("modes", () => {
  it("registers all eight config modes", () => {
    expect(ALL_MODES).toHaveLength(8)
    for (const id of [
      "claude-raw",
      "claude-project-instructions",
      "claude-shadcn-mcp",
      "claude-tailwind-eslint",
      "claude-buoy",
      "claude-drift-guard",
      "claude-snapline",
      "claude-shadcn-mcp-snapline",
    ]) {
      expect(resolveMode(id).id).toBe(id)
    }
    expect(() => resolveMode("nope")).toThrow(/Unknown mode/)
  })
})

describe("report + graph smoke (one sample, two modes)", () => {
  const dirty = [1, 2, 3].map((n) =>
    runFromScan("claude-raw", path.join(benchRoot, "samples", "drifted-app"), n),
  )
  const clean = [1, 2, 3].map((n) =>
    runFromScan("claude-snapline", path.join(repoRoot, "fixtures", "next-shadcn-basic"), n),
  )
  const runs = [...dirty, ...clean]

  it("medians are computed from real scans", () => {
    expect(median([1, 3, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    const raw = summarizeMode("claude-raw", runs)
    const snapline = summarizeMode("claude-snapline", runs)
    expect(raw.median?.driftScore).toBe(171)
    expect(snapline.median?.driftScore).toBe(0)
    expect(raw.failures).toBe(0)
  })

  it("failed runs are excluded from medians but counted", () => {
    const failed: BenchmarkRun = {
      ...dirty[0]!,
      id: "claude-raw--smoke--9",
      result: { ...dirty[0]!.result, failure: "agent exited 1" },
    }
    const summary = summarizeMode("claude-raw", [...runs, failed])
    expect(summary.failures).toBe(1)
    expect(summary.median?.driftScore).toBe(171)
  })

  it("markdown report renders values for run modes and TBD for others", () => {
    const md = reportMarkdown(buildReport(runs))
    expect(md).toContain("| claude-raw | 3 | 0 | 171.0 |")
    expect(md).toContain("| claude-buoy | 0 | 0 | TBD |")
    expect(md).toContain("never fabricated")
  })

  it("SVG generator is deterministic and renders TBD bars", () => {
    const bars = [
      { label: "claude-raw", value: 171 },
      { label: "claude-snapline", value: 0, highlight: true },
      { label: "claude-buoy", value: null },
    ]
    const a = svgBarChart("drift", "smoke", bars)
    const b = svgBarChart("drift", "smoke", bars)
    expect(a).toBe(b)
    expect(a).toContain("TBD — no runs recorded")
    expect(a).toContain("claude-snapline")
    expect(a.startsWith("<svg xmlns")).toBe(true)
  })
})

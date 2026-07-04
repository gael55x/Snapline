import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { defaultConfig } from "../../src/config.js"
import {
  scanProject,
  scanFiles,
  buildScanDeps,
  listScannableFiles,
} from "../../src/scanner/scan-project.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const fixturesRoot = path.join(here, "..", "..", "..", "..", "fixtures")

const FIXTURES = ["next-shadcn-basic", "next-shadcn-custom-theme", "next-shadcn-dashboard-app"]

describe("fixture projects", () => {
  for (const fixture of FIXTURES) {
    it(`${fixture} scans clean`, () => {
      const root = path.join(fixturesRoot, fixture)
      const result = scanProject(root, defaultConfig())
      expect(result.scannedFiles.length).toBeGreaterThan(3)
      expect(result.violations).toEqual([])
      expect(result.score.driftScore).toBe(0)
      expect(result.score.componentReuseRate).toBe(1)
    })
  }

  it("registry resolves shadcn components in the dashboard fixture", () => {
    const root = path.join(fixturesRoot, "next-shadcn-dashboard-app")
    const deps = buildScanDeps(root, defaultConfig())
    for (const name of ["Button", "Input", "Dialog", "Card"]) {
      expect(
        deps.componentRegistry.components.find((c) => c.name === name)?.fileExists,
        `${name} should resolve`,
      ).toBe(true)
    }
    expect(deps.tokenRegistry.cssVariables).toContain("--primary")
  })

  it("meets the changed-file scan budget (<500ms per file)", () => {
    const root = path.join(fixturesRoot, "next-shadcn-dashboard-app")
    const deps = buildScanDeps(root, defaultConfig())
    const files = listScannableFiles(root)
    const single = files.find((f) => f.endsWith("page.tsx"))
    expect(single).toBeDefined()
    const durations: number[] = []
    for (let i = 0; i < 5; i++) {
      durations.push(scanFiles(root, [single!], deps).durationMs)
    }
    durations.sort((a, b) => a - b)
    expect(durations[durations.length - 1]!).toBeLessThan(500)
  })

  it("meets the stop-scan budget (<3s for the full fixture)", () => {
    const root = path.join(fixturesRoot, "next-shadcn-dashboard-app")
    const result = scanProject(root, defaultConfig())
    expect(result.durationMs).toBeLessThan(3000)
  })
})

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { scanFile } from "../../src/scanner/scan-file.js"
import { computeScore } from "../../src/scorer/drift-score.js"
import { countComponentReuse } from "../../src/scorer/component-reuse-rate.js"
import { fakeRegistry, testDeps } from "../helpers.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const sample = (name: string) => fs.readFileSync(path.join(here, "..", "samples", name), "utf8")

describe("drift score", () => {
  it("scores the dirty sample per ui-drift-score-v1 and zeroes the clean one", () => {
    const dirty = scanFile("src/app/billing/page.tsx", sample("dirty-billing-page.tsx"), testDeps())
    const dirtyScore = computeScore(
      dirty.violations,
      countComponentReuse(dirty.elements, fakeRegistry()),
    )
    expect(dirtyScore.driftScore).toBeGreaterThan(20)
    expect(dirtyScore.rawHexValues).toBeGreaterThan(0)
    expect(dirtyScore.inlineStyleObjects).toBeGreaterThan(0)
    expect(dirtyScore.arbitraryTailwindValues).toBeGreaterThan(0)
    expect(dirtyScore.rawPaletteClasses).toBeGreaterThan(0)
    expect(dirtyScore.rawPrimitiveCount).toBeGreaterThanOrEqual(2)
    expect(dirtyScore.componentReuseRate).toBeLessThan(0.5)

    const clean = scanFile("src/app/billing/page.tsx", sample("clean-billing-page.tsx"), testDeps())
    const cleanScore = computeScore(
      clean.violations,
      countComponentReuse(clean.elements, fakeRegistry()),
    )
    expect(clean.violations).toEqual([])
    expect(cleanScore.driftScore).toBe(0)
    expect(cleanScore.componentReuseRate).toBe(1)
  })

  it("is deterministic", () => {
    const a = scanFile("src/x.tsx", sample("dirty-billing-page.tsx"), testDeps())
    const b = scanFile("src/x.tsx", sample("dirty-billing-page.tsx"), testDeps())
    expect(JSON.stringify(a.violations)).toBe(JSON.stringify(b.violations))
  })

  it("verifies the exact formula weights", () => {
    const violations = scanFile(
      "src/x.tsx",
      sample("dirty-billing-page.tsx"),
      testDeps(),
    ).violations
    const score = computeScore(violations, { designSystemUses: 0, rawPrimitiveUses: 0 })
    const expected =
      score.errorViolations * 5 +
      score.warningViolations * 2 +
      score.rawHexValues * 4 +
      score.inlineStyleObjects * 4 +
      score.arbitraryTailwindValues * 3 +
      score.rawPaletteClasses * 2 +
      score.rawPrimitiveCount * 3 +
      score.duplicateComponentCount * 5
    expect(score.driftScore).toBe(expected)
  })
})

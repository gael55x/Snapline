import type { ScoreResult, Violation } from "@usesnapline/contracts"

export interface ReuseCounts {
  readonly designSystemUses: number
  readonly rawPrimitiveUses: number
}

const RULE_COUNTERS = {
  "no-raw-hex": "rawHexValues",
  "no-inline-style": "inlineStyleObjects",
  "no-arbitrary-tailwind": "arbitraryTailwindValues",
  "no-raw-palette-color": "rawPaletteClasses",
  "no-duplicate-components": "duplicateComponentCount",
} as const

/**
 * ui-drift-score-v1:
 *   errors*5 + warnings*2 + rawHex*4 + inlineStyle*4 + arbitrary*3
 *   + rawPalette*2 + rawPrimitives*3 + duplicates*5
 */
export function computeScore(violations: readonly Violation[], reuse: ReuseCounts): ScoreResult {
  let errorViolations = 0
  let warningViolations = 0
  const counters = {
    rawHexValues: 0,
    inlineStyleObjects: 0,
    arbitraryTailwindValues: 0,
    rawPaletteClasses: 0,
    duplicateComponentCount: 0,
  }
  let rawPrimitiveCount = 0
  for (const violation of violations) {
    if (violation.severity === "error") errorViolations++
    else warningViolations++
    const counter = RULE_COUNTERS[violation.ruleId as keyof typeof RULE_COUNTERS]
    if (counter !== undefined) counters[counter]++
    if (violation.ruleId.startsWith("require-")) rawPrimitiveCount++
  }
  const driftScore =
    errorViolations * 5 +
    warningViolations * 2 +
    counters.rawHexValues * 4 +
    counters.inlineStyleObjects * 4 +
    counters.arbitraryTailwindValues * 3 +
    counters.rawPaletteClasses * 2 +
    rawPrimitiveCount * 3 +
    counters.duplicateComponentCount * 5
  return {
    driftScore,
    totalViolations: violations.length,
    errorViolations,
    warningViolations,
    ...counters,
    rawPrimitiveCount,
    componentReuseRate: computeReuseRate(reuse),
  }
}

function computeReuseRate(reuse: ReuseCounts): number {
  const denominator = reuse.designSystemUses + reuse.rawPrimitiveUses
  if (denominator === 0) return 1
  return round4(reuse.designSystemUses / denominator)
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}

import type { FileRule, RuleViolationDraft } from "./context.js"
import {
  stripVariants,
  isArbitraryValue,
  arbitraryValue,
  containsRawHex,
  suggestScaleClass,
} from "../scanner/tailwind-classes.js"

/**
 * no-arbitrary-tailwind: arbitrary values like mt-[13px], w-[472px], text-[14px].
 * Hex-valued classes are handled by no-raw-hex, not here (no double counting).
 * CSS-variable references like bg-[var(--brand)] still count: the token should
 * be mapped in the Tailwind theme, not inlined.
 */
export const noArbitraryTailwind: FileRule = (ctx) => {
  const drafts: RuleViolationDraft[] = []
  for (const cls of ctx.classes) {
    const base = stripVariants(cls.value)
    if (!isArbitraryValue(base)) continue
    const value = arbitraryValue(base)
    if (value === undefined || containsRawHex(value)) continue
    const suggestion = suggestScaleClass(base)
    const instruction =
      suggestion !== undefined
        ? suggestion.exact
          ? `Replace ${cls.value} with ${suggestion.cls}.`
          : `Replace ${cls.value} with ${suggestion.cls} (${suggestion.px}px) if the value is still needed — arbitrary values bypass the design scale.`
        : `Remove ${cls.value}. Use a value from the design scale, or add a theme token if the design genuinely needs it.`
    drafts.push({
      ruleId: "no-arbitrary-tailwind",
      message: `Arbitrary Tailwind value "${cls.value}"`,
      evidence: cls.value,
      line: cls.line,
      column: cls.column,
      instruction,
      safeFix: suggestion?.exact === true,
      replacement: suggestion?.exact === true ? suggestion.cls : undefined,
    })
  }
  return drafts
}

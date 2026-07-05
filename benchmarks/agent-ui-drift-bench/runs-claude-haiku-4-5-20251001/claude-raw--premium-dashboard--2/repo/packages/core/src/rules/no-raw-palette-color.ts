import type { FileRule, RuleViolationDraft } from "./context.js"
import { stripVariants, isRawPaletteClass } from "../scanner/tailwind-classes.js"
import { isAllowedColorClass } from "../registry/token-registry.js"
import { semanticReplacement, ambiguousSuggestion } from "./semantic-color-map.js"

/**
 * no-raw-palette-color: raw Tailwind palette classes (bg-blue-500, text-gray-500,
 * border-zinc-200, bg-white) when the project uses semantic tokens.
 */
export const noRawPaletteColor: FileRule = (ctx) => {
  if (!ctx.tokenRegistry.semanticOnly) return []
  const drafts: RuleViolationDraft[] = []
  for (const cls of ctx.classes) {
    const base = stripVariants(cls.value)
    if (!isRawPaletteClass(base)) continue
    if (isAllowedColorClass(ctx.tokenRegistry, base)) continue
    const withoutOpacity = base.replace(/\/\d{1,3}$/, "")
    const replacement = semanticReplacement(withoutOpacity)
    const ambiguous = ambiguousSuggestion(withoutOpacity)
    const instruction =
      replacement !== undefined
        ? `Replace ${cls.value} with ${replacement}.`
        : ambiguous !== undefined
          ? `Replace ${cls.value} with ${ambiguous}, depending on the surface.`
          : `Replace ${cls.value} with a semantic token class from the theme (see snapline.yml tokens.colors.allowed).`
    drafts.push({
      ruleId: "no-raw-palette-color",
      message: `Raw Tailwind palette color "${cls.value}"`,
      evidence: cls.value,
      line: cls.line,
      column: cls.column,
      instruction,
      safeFix: replacement !== undefined,
      replacement,
    })
  }
  return drafts
}

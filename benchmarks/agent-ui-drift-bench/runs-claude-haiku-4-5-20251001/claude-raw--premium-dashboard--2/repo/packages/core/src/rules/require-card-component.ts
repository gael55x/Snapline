import type { FileRule, RuleViolationDraft } from "./context.js"
import { registryComponent } from "../registry/component-registry.js"

function looksLikeCard(classes: readonly string[]): boolean {
  const hasRadius = classes.some((c) => c === "rounded" || c.startsWith("rounded-"))
  const hasEdge = classes.some((c) => c === "border" || c.startsWith("shadow"))
  const hasSurface = classes.some((c) => c.startsWith("bg-"))
  return hasRadius && hasEdge && hasSurface
}

/**
 * require-card-component: repeated hand-rolled card containers while <Card> exists.
 * Only fires when the pattern repeats (2+ in a file) — a single styled div is
 * not evidence of a duplicated card system. Advisory severity by default.
 */
export const requireCardComponent: FileRule = (ctx) => {
  if (ctx.isUiSource) return []
  const card = registryComponent(ctx.componentRegistry, "Card")
  if (card === undefined) return []
  const candidates = ctx.elements.filter((el) => el.tagName === "div" && looksLikeCard(el.classes))
  if (candidates.length < 2) return []
  const drafts: RuleViolationDraft[] = []
  for (const el of candidates) {
    drafts.push({
      ruleId: "require-card-component",
      message: `Repeated custom card container while <Card> exists`,
      evidence: `<div className="${el.classes.join(" ")}">`,
      line: el.line,
      column: el.column,
      instruction: `Replace this container with Card and CardContent from "${card.importPath}" (CardHeader/CardTitle for the heading region).`,
      safeFix: false,
    })
  }
  return drafts
}

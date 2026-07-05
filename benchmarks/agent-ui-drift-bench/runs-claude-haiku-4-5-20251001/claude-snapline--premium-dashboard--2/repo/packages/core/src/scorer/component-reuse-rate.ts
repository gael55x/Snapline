import type { ComponentRegistry } from "@usesnapline/contracts"
import type { JsxElementInfo } from "../scanner/extract-jsx-elements.js"
import type { ReuseCounts } from "./drift-score.js"

const RAW_PRIMITIVES = new Set(["button", "input", "select", "textarea"])

/**
 * Count design-system component uses vs raw primitive uses across elements.
 * A tag counts as a design-system use when it is (or starts with) a registry
 * component name — CardHeader counts toward Card.
 */
export function countComponentReuse(
  elements: readonly JsxElementInfo[],
  registry: ComponentRegistry,
): ReuseCounts {
  const names = registry.components.filter((c) => c.fileExists).map((c) => c.name)
  let designSystemUses = 0
  let rawPrimitiveUses = 0
  for (const el of elements) {
    const first = el.tagName[0]
    if (first !== undefined && first === first.toUpperCase() && first !== first.toLowerCase()) {
      if (names.some((n) => el.tagName === n || el.tagName.startsWith(n))) designSystemUses++
      continue
    }
    if (RAW_PRIMITIVES.has(el.tagName)) rawPrimitiveUses++
  }
  return { designSystemUses, rawPrimitiveUses }
}

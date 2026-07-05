import type { FileRule, RuleViolationDraft } from "./context.js"
import { nearestSpacingToken, parsePx } from "../scanner/tailwind-classes.js"

const PROP_TO_PREFIX: Readonly<Record<string, string>> = {
  margin: "m",
  marginTop: "mt",
  marginBottom: "mb",
  marginLeft: "ml",
  marginRight: "mr",
  padding: "p",
  paddingTop: "pt",
  paddingBottom: "pb",
  paddingLeft: "pl",
  paddingRight: "pr",
  gap: "gap",
  width: "w",
  height: "h",
}

/** Exact Tailwind class for a static style property when one exists. */
export function tailwindClassForStyleProp(name: string, value: string): string | undefined {
  const prefix = PROP_TO_PREFIX[name]
  if (prefix === undefined) return undefined
  const px = parsePx(value) ?? (/^\d+$/.test(value) ? Number(value) : undefined)
  if (px === undefined) return undefined
  const hit = nearestSpacingToken(px)
  return hit?.exact === true ? `${prefix}-${hit.token}` : undefined
}

/**
 * no-inline-style: any style={{ ... }} object literal.
 * The repair suggests exact Tailwind classes when properties map onto the scale.
 */
export const noInlineStyle: FileRule = (ctx) => {
  const drafts: RuleViolationDraft[] = []
  for (const style of ctx.inlineStyles) {
    const mapped: string[] = []
    let allMapped = style.properties.length > 0 && style.fullyStatic
    for (const prop of style.properties) {
      const cls =
        prop.value !== undefined ? tailwindClassForStyleProp(prop.name, prop.value) : undefined
      if (cls !== undefined) mapped.push(cls)
      else allMapped = false
    }
    const suggestion =
      mapped.length > 0
        ? `Replace the style object with Tailwind classes: ${mapped.join(" ")}.`
        : "Replace the style object with Tailwind utility classes on the design-system scale."
    drafts.push({
      ruleId: "no-inline-style",
      message: `Inline style object on <${style.tagName ?? "element"}>`,
      evidence: style.raw,
      line: style.line,
      column: style.column,
      instruction: `Remove the style attribute. ${suggestion}`,
      safeFix: allMapped,
      replacement: allMapped ? mapped.join(" ") : undefined,
    })
  }
  return drafts
}

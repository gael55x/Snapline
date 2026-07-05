import type { FileRule, RuleViolationDraft } from "./context.js"
import { stripVariants, containsRawHex } from "../scanner/tailwind-classes.js"

/**
 * no-raw-hex: hex color values anywhere in class names or inline styles.
 * Catches text-[#6366f1], bg-[#111827], style={{ color: "#6366f1" }}.
 */
export const noRawHex: FileRule = (ctx) => {
  const drafts: RuleViolationDraft[] = []
  for (const cls of ctx.classes) {
    if (!containsRawHex(stripVariants(cls.value))) continue
    drafts.push({
      ruleId: "no-raw-hex",
      message: `Raw hex color in class "${cls.value}"`,
      evidence: cls.value,
      line: cls.line,
      column: cls.column,
      instruction: `Replace ${cls.value} with a semantic token class from the theme (for example bg-primary, text-foreground, border-border). Raw hex values bypass the design system.`,
      safeFix: false,
    })
  }
  for (const style of ctx.inlineStyles) {
    for (const prop of style.properties) {
      if (prop.value === undefined || !containsRawHex(prop.value)) continue
      drafts.push({
        ruleId: "no-raw-hex",
        message: `Raw hex color "${prop.value}" in inline style property ${prop.name}`,
        evidence: `${prop.name}: "${prop.value}"`,
        line: style.line,
        column: style.column,
        instruction: `Remove ${prop.name}: "${prop.value}" from the style object and use a semantic Tailwind class instead (for example text-primary or bg-card).`,
        safeFix: false,
      })
    }
  }
  return drafts
}

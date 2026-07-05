import type { FileRule, RuleViolationDraft } from "./context.js"
import { registryComponent } from "../registry/component-registry.js"

const SAFE_BUTTON_ATTRS = new Set(["type", "onClick", "disabled", "className", "id", "children"])

export function isSimpleElement(
  attributes: Readonly<Record<string, string | true>>,
  hasSpread: boolean,
  hasDynamic: boolean,
  safeAttrs: ReadonlySet<string>,
): boolean {
  if (hasSpread) return false
  if (hasDynamic) return false
  return Object.keys(attributes).every(
    (name) => safeAttrs.has(name) || name.startsWith("aria-") || name.startsWith("data-"),
  )
}

/** require-button-component: raw <button> while the project has a Button component. */
export const requireButtonComponent: FileRule = (ctx) => {
  if (ctx.isUiSource) return []
  const button = registryComponent(ctx.componentRegistry, "Button")
  if (button === undefined) return []
  const drafts: RuleViolationDraft[] = []
  for (const el of ctx.elements) {
    if (el.tagName !== "button") continue
    drafts.push({
      ruleId: "require-button-component",
      message: `Raw <button> used while <Button> exists`,
      evidence: "<button>",
      line: el.line,
      column: el.column,
      instruction: `Import Button from "${button.importPath}" and replace the raw <button> with <Button>. Use variant props (variant="default" | "outline" | "ghost" | "destructive") instead of color classes.`,
      safeFix: isSimpleElement(el.attributes, el.hasSpreadAttribute, false, SAFE_BUTTON_ATTRS),
    })
  }
  return drafts
}

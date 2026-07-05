import type { FileRule, RuleViolationDraft } from "./context.js"
import { registryComponent } from "../registry/component-registry.js"
import { isSimpleElement } from "./require-button-component.js"

const SAFE_INPUT_ATTRS = new Set([
  "type",
  "name",
  "id",
  "value",
  "defaultValue",
  "placeholder",
  "onChange",
  "disabled",
  "required",
  "readOnly",
  "className",
  "autoComplete",
  "min",
  "max",
  "step",
])

/** require-input-component: raw <input> while the project has an Input component. */
export const requireInputComponent: FileRule = (ctx) => {
  if (ctx.isUiSource) return []
  const input = registryComponent(ctx.componentRegistry, "Input")
  if (input === undefined) return []
  const drafts: RuleViolationDraft[] = []
  for (const el of ctx.elements) {
    if (el.tagName !== "input") continue
    // Hidden inputs are data plumbing, not UI.
    if (el.attributes.type === "hidden") continue
    // Checkbox/radio have dedicated shadcn components; converting to <Input> would be wrong.
    if (el.attributes.type === "checkbox" || el.attributes.type === "radio") continue
    drafts.push({
      ruleId: "require-input-component",
      message: `Raw <input> used while <Input> exists`,
      evidence: "<input>",
      line: el.line,
      column: el.column,
      instruction: `Import Input from "${input.importPath}" and replace the raw <input> with <Input>. Drop hand-rolled border/focus classes — Input carries system styling.`,
      safeFix: isSimpleElement(el.attributes, el.hasSpreadAttribute, false, SAFE_INPUT_ATTRS),
    })
  }
  return drafts
}

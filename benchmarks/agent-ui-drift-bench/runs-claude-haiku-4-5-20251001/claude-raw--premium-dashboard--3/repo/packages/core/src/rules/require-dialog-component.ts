import type { FileRule, RuleViolationDraft } from "./context.js"
import { registryComponent } from "../registry/component-registry.js"

const OVERLAY_TAGS = new Set(["div", "section", "aside"])

/**
 * require-dialog-component: likely hand-rolled dialogs while <Dialog> exists.
 * High-confidence signals only: role="dialog", aria-modal, or a fixed inset-0
 * overlay with a z-index. Advisory severity by default — modal detection is
 * heuristic and must never block on a guess.
 */
export const requireDialogComponent: FileRule = (ctx) => {
  if (ctx.isUiSource) return []
  const dialog = registryComponent(ctx.componentRegistry, "Dialog")
  if (dialog === undefined) return []
  const drafts: RuleViolationDraft[] = []
  for (const el of ctx.elements) {
    if (!OVERLAY_TAGS.has(el.tagName)) continue
    const explicitRole = el.attributes.role === "dialog" || "aria-modal" in el.attributes
    const overlayLike =
      el.classes.includes("fixed") &&
      el.classes.includes("inset-0") &&
      el.classes.some((c) => c === "z-50" || /^z-\d+$/.test(c))
    if (!explicitRole && !overlayLike) continue
    drafts.push({
      ruleId: "require-dialog-component",
      message: explicitRole
        ? `Hand-rolled dialog (<${el.tagName} role="dialog">) while <Dialog> exists`
        : `Likely custom modal overlay (fixed inset-0) while <Dialog> exists`,
      evidence: explicitRole
        ? `<${el.tagName} role="dialog">`
        : `<${el.tagName} className="fixed inset-0 ...">`,
      line: el.line,
      column: el.column,
      instruction: `Rebuild this modal with Dialog, DialogContent, DialogHeader, and DialogTitle from "${dialog.importPath}". The system Dialog handles the overlay, focus, and escape behavior.`,
      safeFix: false,
    })
  }
  return drafts
}

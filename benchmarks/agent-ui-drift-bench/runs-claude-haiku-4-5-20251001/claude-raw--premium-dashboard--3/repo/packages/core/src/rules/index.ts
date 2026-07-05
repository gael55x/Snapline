import type { FileRule } from "./context.js"
import { noRawHex } from "./no-raw-hex.js"
import { noInlineStyle } from "./no-inline-style.js"
import { noArbitraryTailwind } from "./no-arbitrary-tailwind.js"
import { noRawPaletteColor } from "./no-raw-palette-color.js"
import { requireButtonComponent } from "./require-button-component.js"
import { requireInputComponent } from "./require-input-component.js"
import { requireDialogComponent } from "./require-dialog-component.js"
import { requireCardComponent } from "./require-card-component.js"

/** All file-level rules, in stable execution order. */
export const FILE_RULES: readonly FileRule[] = [
  noRawHex,
  noInlineStyle,
  noArbitraryTailwind,
  noRawPaletteColor,
  requireButtonComponent,
  requireInputComponent,
  requireDialogComponent,
  requireCardComponent,
]

export { noDuplicateComponents } from "./no-duplicate-components.js"
export type { FileScanContext, RuleViolationDraft, FileRule } from "./context.js"
export { finalizeViolations, severityFor } from "./context.js"

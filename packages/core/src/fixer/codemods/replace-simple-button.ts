import type ts from "typescript"
import type { ComponentRegistryEntry } from "@usesnapline/contracts"
import { replaceSimpleElementEdits } from "./replace-simple-element.js"
import type { TextEdit } from "../types.js"

const SAFE_BUTTON_ATTRS = new Set(["type", "onClick", "disabled", "className", "id"])

export function replaceSimpleButtonEdits(
  sourceFile: ts.SourceFile,
  button: ComponentRegistryEntry,
): TextEdit[] {
  return replaceSimpleElementEdits(sourceFile, {
    rawTag: "button",
    component: button,
    safeAttrs: SAFE_BUTTON_ATTRS,
  })
}

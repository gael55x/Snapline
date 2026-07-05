import type ts from "typescript"
import type { ComponentRegistryEntry } from "@usesnapline/contracts"
import { replaceSimpleElementEdits } from "./replace-simple-element.js"
import type { TextEdit } from "../types.js"

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

export function replaceSimpleInputEdits(
  sourceFile: ts.SourceFile,
  input: ComponentRegistryEntry,
): TextEdit[] {
  return replaceSimpleElementEdits(sourceFile, {
    rawTag: "input",
    component: input,
    safeAttrs: SAFE_INPUT_ATTRS,
  })
}

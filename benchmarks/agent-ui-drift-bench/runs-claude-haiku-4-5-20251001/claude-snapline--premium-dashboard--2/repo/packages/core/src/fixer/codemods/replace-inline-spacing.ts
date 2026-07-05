import ts from "typescript"
import { extractInlineStyles } from "../../scanner/extract-inline-styles.js"
import { tailwindClassForStyleProp } from "../../rules/no-inline-style.js"
import type { TextEdit } from "../types.js"

function staticClassNameAttr(
  sourceFile: ts.SourceFile,
  attrStart: number,
): { literal: ts.StringLiteral } | "absent" | "dynamic" {
  let found: { literal: ts.StringLiteral } | "absent" | "dynamic" = "absent"
  const visit = (node: ts.Node): void => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText() === "style" &&
      node.getStart(sourceFile) === attrStart
    ) {
      for (const prop of node.parent.properties) {
        if (ts.isJsxAttribute(prop) && prop.name.getText() === "className") {
          found =
            prop.initializer !== undefined && ts.isStringLiteral(prop.initializer)
              ? { literal: prop.initializer }
              : "dynamic"
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/**
 * Remove style objects whose every property is margin/padding/gap/size with an
 * exact Tailwind-scale value, moving them into className. Skipped when the
 * element's className is dynamic — rewriting expressions is not a safe fix.
 */
export function replaceInlineSpacingEdits(sourceFile: ts.SourceFile): TextEdit[] {
  const edits: TextEdit[] = []
  for (const style of extractInlineStyles(sourceFile)) {
    if (!style.fullyStatic || style.properties.length === 0) continue
    const classes: string[] = []
    let allMapped = true
    for (const prop of style.properties) {
      const cls =
        prop.value !== undefined ? tailwindClassForStyleProp(prop.name, prop.value) : undefined
      if (cls === undefined) {
        allMapped = false
        break
      }
      classes.push(cls)
    }
    if (!allMapped) continue
    const className = staticClassNameAttr(sourceFile, style.attrStart)
    if (className === "dynamic") continue
    if (className === "absent") {
      edits.push({
        start: style.attrStart,
        end: style.attrEnd,
        newText: `className="${classes.join(" ")}"`,
        description: `style object -> className="${classes.join(" ")}"`,
      })
      continue
    }
    const literal = className.literal
    edits.push({
      start: style.attrStart,
      end: style.attrEnd,
      newText: "",
      description: `remove style object (${classes.join(" ")})`,
    })
    edits.push({
      start: literal.getEnd() - 1,
      end: literal.getEnd() - 1,
      newText: ` ${classes.join(" ")}`,
      description: `append ${classes.join(" ")} to className`,
    })
  }
  return edits
}

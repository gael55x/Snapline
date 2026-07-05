import ts from "typescript"
import { positionAt } from "./parse-tsx.js"

export interface JsxElementInfo {
  readonly tagName: string
  /** Static string attributes only (value true for bare attributes). */
  readonly attributes: Readonly<Record<string, string | true>>
  /** Statically-readable class tokens on this element. */
  readonly classes: readonly string[]
  readonly hasSpreadAttribute: boolean
  /** True when any attribute value is a non-static expression. */
  readonly hasDynamicAttributes: boolean
  readonly selfClosing: boolean
  readonly line: number
  readonly column: number
  readonly start: number
  readonly end: number
  /** End offset of the whole element including children and closing tag. */
  readonly elementEnd: number
}

function readAttributes(attrs: ts.JsxAttributes): {
  attributes: Record<string, string | true>
  classes: string[]
  hasSpread: boolean
  hasDynamic: boolean
} {
  const attributes: Record<string, string | true> = {}
  const classes: string[] = []
  let hasSpread = false
  let hasDynamic = false
  for (const prop of attrs.properties) {
    if (ts.isJsxSpreadAttribute(prop)) {
      hasSpread = true
      continue
    }
    const name = prop.name.getText()
    if (prop.initializer === undefined) {
      attributes[name] = true
      continue
    }
    if (ts.isStringLiteral(prop.initializer)) {
      attributes[name] = prop.initializer.text
      if (name === "className" || name === "class")
        classes.push(...prop.initializer.text.split(/\s+/).filter(Boolean))
      continue
    }
    hasDynamic = true
  }
  return { attributes, classes, hasSpread, hasDynamic }
}

/** Extract every JSX element with its static attributes. */
export function extractJsxElements(sourceFile: ts.SourceFile): readonly JsxElementInfo[] {
  const out: JsxElementInfo[] = []
  const record = (
    tag: ts.JsxTagNameExpression,
    attrs: ts.JsxAttributes,
    selfClosing: boolean,
    start: number,
    end: number,
    elementEnd: number,
  ): void => {
    const pos = positionAt(sourceFile, start)
    const { attributes, classes, hasSpread, hasDynamic } = readAttributes(attrs)
    out.push({
      tagName: tag.getText(),
      attributes,
      classes,
      hasSpreadAttribute: hasSpread,
      hasDynamicAttributes: hasDynamic,
      selfClosing,
      line: pos.line,
      column: pos.column,
      start,
      end,
      elementEnd,
    })
  }
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node)) {
      record(
        node.openingElement.tagName,
        node.openingElement.attributes,
        false,
        node.openingElement.getStart(sourceFile),
        node.openingElement.getEnd(),
        node.getEnd(),
      )
    } else if (ts.isJsxSelfClosingElement(node)) {
      record(
        node.tagName,
        node.attributes,
        true,
        node.getStart(sourceFile),
        node.getEnd(),
        node.getEnd(),
      )
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return out
}

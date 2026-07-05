import ts from "typescript"
import { positionAt } from "./parse-tsx.js"

export interface InlineStyleProperty {
  readonly name: string
  /** Static string/number value; undefined when dynamic. */
  readonly value?: string
}

export interface InlineStyleInfo {
  readonly properties: readonly InlineStyleProperty[]
  /** The literal source text, e.g. `{{ marginTop: "13px" }}`. */
  readonly raw: string
  readonly tagName?: string
  readonly line: number
  readonly column: number
  /** Offsets covering the whole `style={...}` attribute. */
  readonly attrStart: number
  readonly attrEnd: number
  /** True when every property has a statically-readable value. */
  readonly fullyStatic: boolean
}

/** Extract style={{ ... }} attributes with object-literal values. */
export function extractInlineStyles(sourceFile: ts.SourceFile): readonly InlineStyleInfo[] {
  const out: InlineStyleInfo[] = []
  const visit = (node: ts.Node): void => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText() === "style" &&
      node.initializer !== undefined &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression !== undefined &&
      ts.isObjectLiteralExpression(node.initializer.expression)
    ) {
      const objectLiteral = node.initializer.expression
      const properties: InlineStyleProperty[] = []
      let fullyStatic = true
      for (const prop of objectLiteral.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          if (ts.isStringLiteral(prop.initializer) || ts.isNumericLiteral(prop.initializer)) {
            properties.push({ name: prop.name.text, value: prop.initializer.text })
          } else {
            properties.push({ name: prop.name.text })
            fullyStatic = false
          }
        } else {
          fullyStatic = false
        }
      }
      const parent = node.parent.parent
      const tagName =
        ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent)
          ? parent.tagName.getText()
          : undefined
      const start = node.getStart(sourceFile)
      const pos = positionAt(sourceFile, start)
      out.push({
        properties,
        raw: node.getText(sourceFile),
        tagName,
        line: pos.line,
        column: pos.column,
        attrStart: start,
        attrEnd: node.getEnd(),
        fullyStatic,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return out
}

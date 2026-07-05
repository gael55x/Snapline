import ts from "typescript"
import { positionAt } from "./parse-tsx.js"

export interface ExtractedClass {
  /** One class token, e.g. "bg-blue-500". */
  readonly value: string
  /** 1-based position of the token itself. */
  readonly line: number
  readonly column: number
  /** Absolute character offset of the token in the source text. */
  readonly start: number
  readonly end: number
  /** JSX tag the className belongs to, when known. */
  readonly tagName?: string
}

function tagNameOf(attr: ts.JsxAttribute): string | undefined {
  const parent = attr.parent.parent
  if (ts.isJsxSelfClosingElement(parent) || ts.isJsxOpeningElement(parent)) {
    return parent.tagName.getText()
  }
  return undefined
}

function tokenize(
  sourceFile: ts.SourceFile,
  text: string,
  textStart: number,
  tagName: string | undefined,
  out: ExtractedClass[],
): void {
  const re = /\S+/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const start = textStart + match.index
    const pos = positionAt(sourceFile, start)
    out.push({
      value: match[0],
      line: pos.line,
      column: pos.column,
      start,
      end: start + match[0].length,
      tagName,
    })
  }
}

/**
 * Collect statically-readable class tokens inside an expression:
 * string literals, no-substitution templates, template quasis, and string
 * arguments of helper calls like cn()/clsx()/cva(). Dynamic parts are skipped —
 * Snapline never guesses about runtime values.
 */
function collectFromExpression(
  sourceFile: ts.SourceFile,
  expr: ts.Expression,
  tagName: string | undefined,
  out: ExtractedClass[],
): void {
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    tokenize(sourceFile, expr.text, expr.getStart(sourceFile) + 1, tagName, out)
    return
  }
  if (ts.isTemplateExpression(expr)) {
    tokenize(sourceFile, expr.head.text, expr.head.getStart(sourceFile) + 1, tagName, out)
    for (const span of expr.templateSpans) {
      collectFromExpression(sourceFile, span.expression, tagName, out)
      tokenize(sourceFile, span.literal.text, span.literal.getStart(sourceFile) + 1, tagName, out)
    }
    return
  }
  if (ts.isCallExpression(expr)) {
    for (const arg of expr.arguments) collectFromExpression(sourceFile, arg, tagName, out)
    return
  }
  if (ts.isConditionalExpression(expr)) {
    collectFromExpression(sourceFile, expr.whenTrue, tagName, out)
    collectFromExpression(sourceFile, expr.whenFalse, tagName, out)
    return
  }
  if (ts.isBinaryExpression(expr)) {
    collectFromExpression(sourceFile, expr.left, tagName, out)
    collectFromExpression(sourceFile, expr.right, tagName, out)
    return
  }
  if (ts.isParenthesizedExpression(expr)) {
    collectFromExpression(sourceFile, expr.expression, tagName, out)
  }
}

/** Extract every statically-readable class token from className/class attributes. */
export function extractClassNames(sourceFile: ts.SourceFile): readonly ExtractedClass[] {
  const out: ExtractedClass[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText()
      if (name === "className" || name === "class") {
        const tagName = tagNameOf(node)
        if (node.initializer !== undefined) {
          if (ts.isStringLiteral(node.initializer)) {
            tokenize(
              sourceFile,
              node.initializer.text,
              node.initializer.getStart(sourceFile) + 1,
              tagName,
              out,
            )
          } else if (
            ts.isJsxExpression(node.initializer) &&
            node.initializer.expression !== undefined
          ) {
            collectFromExpression(sourceFile, node.initializer.expression, tagName, out)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return out
}

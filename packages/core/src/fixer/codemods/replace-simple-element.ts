import ts from "typescript"
import type { ComponentRegistryEntry } from "@usesnapline/contracts"
import { extractImports } from "../../scanner/extract-imports.js"
import type { TextEdit } from "../types.js"

export interface SimpleElementSwap {
  readonly rawTag: "button" | "input"
  readonly component: ComponentRegistryEntry
  readonly safeAttrs: ReadonlySet<string>
}

function attributesAreSimple(attrs: ts.JsxAttributes, safeAttrs: ReadonlySet<string>): boolean {
  for (const prop of attrs.properties) {
    if (ts.isJsxSpreadAttribute(prop)) return false
    const name = prop.name.getText()
    if (name.startsWith("aria-") || name.startsWith("data-")) continue
    if (!safeAttrs.has(name)) return false
    // ref/key or dynamic className rewrites are out of scope for a safe fix.
    if (
      name === "className" &&
      prop.initializer !== undefined &&
      !ts.isStringLiteral(prop.initializer)
    ) {
      return false
    }
  }
  return true
}

/**
 * Swap simple raw <button>/<input> elements to their design-system component.
 * Only tag names change; attributes are preserved. An import is added when the
 * component is not already imported. Anything non-trivial is left for the agent.
 */
export function replaceSimpleElementEdits(
  sourceFile: ts.SourceFile,
  swap: SimpleElementSwap,
): TextEdit[] {
  const edits: TextEdit[] = []
  let swapped = false
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement
      if (
        opening.tagName.getText() === swap.rawTag &&
        attributesAreSimple(opening.attributes, swap.safeAttrs)
      ) {
        const tagStart = opening.tagName.getStart(sourceFile)
        edits.push({
          start: tagStart,
          end: tagStart + swap.rawTag.length,
          newText: swap.component.name,
          description: `<${swap.rawTag}> -> <${swap.component.name}>`,
        })
        const closingTag = node.closingElement.tagName
        edits.push({
          start: closingTag.getStart(sourceFile),
          end: closingTag.getEnd(),
          newText: swap.component.name,
          description: `</${swap.rawTag}> -> </${swap.component.name}>`,
        })
        swapped = true
      }
    } else if (ts.isJsxSelfClosingElement(node)) {
      if (
        node.tagName.getText() === swap.rawTag &&
        attributesAreSimple(node.attributes, swap.safeAttrs)
      ) {
        const tagStart = node.tagName.getStart(sourceFile)
        edits.push({
          start: tagStart,
          end: tagStart + swap.rawTag.length,
          newText: swap.component.name,
          description: `<${swap.rawTag}/> -> <${swap.component.name}/>`,
        })
        swapped = true
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (swapped) {
    const imports = extractImports(sourceFile)
    const existing = imports.find((i) => i.source === swap.component.importPath)
    const alreadyImported = existing?.names.includes(swap.component.name) === true
    if (!alreadyImported) {
      const lastImport = imports[imports.length - 1]
      const insertAt = lastImport !== undefined ? lastImport.end : 0
      const statement = `import { ${swap.component.name} } from "${swap.component.importPath}"`
      edits.push({
        start: insertAt,
        end: insertAt,
        newText: insertAt === 0 ? `${statement}\n` : `\n${statement}`,
        description: `add import ${swap.component.name}`,
      })
    }
  }
  return edits
}

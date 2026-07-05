import type ts from "typescript"
import { extractClassNames } from "../../scanner/extract-classnames.js"
import { stripVariants, isRawPaletteClass } from "../../scanner/tailwind-classes.js"
import { semanticReplacement } from "../../rules/semantic-color-map.js"
import type { TextEdit } from "../types.js"

/**
 * Replace raw palette classes that have an unambiguous semantic mapping:
 * bg-blue-500 -> bg-primary, text-gray-500 -> text-muted-foreground,
 * border-zinc-200 -> border-border. Variant prefixes are preserved.
 */
export function replaceColorClassEdits(sourceFile: ts.SourceFile): TextEdit[] {
  const edits: TextEdit[] = []
  for (const cls of extractClassNames(sourceFile)) {
    const base = stripVariants(cls.value)
    if (!isRawPaletteClass(base)) continue
    const replacement = semanticReplacement(base.replace(/\/\d{1,3}$/, ""))
    if (replacement === undefined) continue
    const prefix = cls.value.slice(0, cls.value.length - base.length)
    edits.push({
      start: cls.start,
      end: cls.end,
      newText: prefix + replacement,
      description: `${cls.value} -> ${prefix + replacement}`,
    })
  }
  return edits
}

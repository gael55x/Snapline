export interface TextEdit {
  readonly start: number
  readonly end: number
  readonly newText: string
  readonly description: string
}

export interface FileFixPlan {
  readonly filePath: string
  readonly edits: readonly TextEdit[]
}

export interface FixPlan {
  readonly files: readonly FileFixPlan[]
}

/** Drop overlapping edits (first wins) and sort ascending. */
export function normalizeEdits(edits: readonly TextEdit[]): TextEdit[] {
  const sorted = [...edits].sort((a, b) => a.start - b.start || a.end - b.end)
  const out: TextEdit[] = []
  let lastEnd = -1
  for (const edit of sorted) {
    if (edit.start < lastEnd) continue
    out.push(edit)
    lastEnd = edit.end
  }
  return out
}

export function applyEdits(sourceText: string, edits: readonly TextEdit[]): string {
  let result = sourceText
  for (const edit of [...normalizeEdits(edits)].reverse()) {
    result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end)
  }
  return result
}

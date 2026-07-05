/**
 * Conservative palette-to-semantic mappings. Only pairs where the intent is
 * unambiguous get a safe replacement; everything else gets advice only.
 */
const EXACT: Readonly<Record<string, string>> = {
  "bg-blue-500": "bg-primary",
  "bg-blue-600": "bg-primary",
  "bg-blue-700": "bg-primary",
  "bg-indigo-500": "bg-primary",
  "bg-indigo-600": "bg-primary",
  "text-blue-500": "text-primary",
  "text-blue-600": "text-primary",
  "bg-red-500": "bg-destructive",
  "bg-red-600": "bg-destructive",
  "text-red-500": "text-destructive",
  "text-red-600": "text-destructive",
}

const NEUTRALS = "(gray|slate|zinc|neutral|stone)"

const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [new RegExp(`^text-${NEUTRALS}-(400|500|600)$`), "text-muted-foreground"],
  [new RegExp(`^text-${NEUTRALS}-(700|800|900|950)$`), "text-foreground"],
  [new RegExp(`^border-${NEUTRALS}-(100|200|300)$`), "border-border"],
  [new RegExp(`^bg-${NEUTRALS}-(50|100)$`), "bg-muted"],
  [new RegExp(`^divide-${NEUTRALS}-(100|200|300)$`), "divide-border"],
  [new RegExp(`^ring-${NEUTRALS}-(200|300)$`), "ring-border"],
]

/** Semantic replacement for a raw palette class, when the mapping is unambiguous. */
export function semanticReplacement(baseClass: string): string | undefined {
  const exact = EXACT[baseClass]
  if (exact !== undefined) return exact
  for (const [pattern, replacement] of PATTERNS) {
    if (pattern.test(baseClass)) return replacement
  }
  return undefined
}

/** Advisory suggestions for classes with more than one plausible mapping. */
export function ambiguousSuggestion(baseClass: string): string | undefined {
  if (/^bg-(white|black)$/.test(baseClass)) return "bg-background or bg-card"
  if (/^text-(white|black)$/.test(baseClass)) return "text-primary-foreground or text-foreground"
  return undefined
}

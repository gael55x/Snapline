/** Utilities for reasoning about individual Tailwind class tokens. Pure functions only. */

/**
 * Strip variant prefixes: "dark:hover:bg-primary" -> "bg-primary".
 * Colons inside brackets (e.g. bg-[color:var(--x)]) are not variant separators.
 */
export function stripVariants(cls: string): string {
  let depth = 0
  let lastColon = -1
  for (let i = 0; i < cls.length; i++) {
    const ch = cls[i]
    if (ch === "[") depth++
    else if (ch === "]") depth--
    else if (ch === ":" && depth === 0) lastColon = i
  }
  return lastColon === -1 ? cls : cls.slice(lastColon + 1)
}

/** True for arbitrary-value utilities like mt-[13px], bg-[#111], w-[472px]. */
export function isArbitraryValue(baseClass: string): boolean {
  return /^!?-?[a-z][a-z0-9-]*-\[.+\]$/.test(baseClass)
}

/** The bracketed value of an arbitrary utility: "mt-[13px]" -> "13px". */
export function arbitraryValue(baseClass: string): string | undefined {
  const match = /\[(.+)\]$/.exec(baseClass)
  return match?.[1]
}

/** The utility prefix of an arbitrary class: "mt-[13px]" -> "mt". */
export function arbitraryPrefix(baseClass: string): string | undefined {
  const match = /^!?(-?[a-z][a-z0-9-]*)-\[/.exec(baseClass)
  return match?.[1]
}

export function containsRawHex(value: string): boolean {
  return /#[0-9a-fA-F]{3,8}\b/.test(value)
}

export const TAILWIND_PALETTE_NAMES: readonly string[] = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

const COLOR_PREFIXES =
  "bg|text|border|ring|fill|stroke|divide|outline|decoration|accent|caret|from|via|to|shadow"

const PALETTE_RE = new RegExp(
  `^(${COLOR_PREFIXES})-(${TAILWIND_PALETTE_NAMES.join("|")})-(50|100|200|300|400|500|600|700|800|900|950)(/\\d{1,3})?$`,
)

const LITERAL_COLOR_RE = new RegExp(`^(${COLOR_PREFIXES})-(white|black)(/\\d{1,3})?$`)

/** True for raw palette utilities like bg-blue-500, text-gray-500/80, bg-white. */
export function isRawPaletteClass(baseClass: string): boolean {
  return PALETTE_RE.test(baseClass) || LITERAL_COLOR_RE.test(baseClass)
}

/** Tailwind spacing scale as px -> scale token, e.g. 12 -> "3". */
const SPACING_SCALE_PX: ReadonlyArray<readonly [number, string]> = [
  [0, "0"],
  [1, "px"],
  [2, "0.5"],
  [4, "1"],
  [6, "1.5"],
  [8, "2"],
  [10, "2.5"],
  [12, "3"],
  [14, "3.5"],
  [16, "4"],
  [20, "5"],
  [24, "6"],
  [28, "7"],
  [32, "8"],
  [36, "9"],
  [40, "10"],
  [44, "11"],
  [48, "12"],
  [56, "14"],
  [64, "16"],
  [80, "20"],
  [96, "24"],
  [112, "28"],
  [128, "32"],
  [144, "36"],
  [160, "40"],
  [176, "44"],
  [192, "48"],
  [208, "52"],
  [224, "56"],
  [240, "60"],
  [256, "64"],
  [288, "72"],
  [320, "80"],
  [384, "96"],
]

export interface ScaleSuggestion {
  readonly token: string
  readonly px: number
  readonly exact: boolean
}

/** Nearest Tailwind spacing token for a px value. Ties resolve to the smaller value. */
export function nearestSpacingToken(px: number): ScaleSuggestion | undefined {
  if (!Number.isFinite(px) || px < 0) return undefined
  let best: readonly [number, string] | undefined
  for (const entry of SPACING_SCALE_PX) {
    if (best === undefined || Math.abs(entry[0] - px) < Math.abs(best[0] - px)) best = entry
  }
  if (best === undefined) return undefined
  return { token: best[1], px: best[0], exact: best[0] === px }
}

const FONT_SIZE_PX: ReadonlyArray<readonly [number, string]> = [
  [12, "text-xs"],
  [14, "text-sm"],
  [16, "text-base"],
  [18, "text-lg"],
  [20, "text-xl"],
  [24, "text-2xl"],
  [30, "text-3xl"],
  [36, "text-4xl"],
  [48, "text-5xl"],
]

const RADIUS_PX: ReadonlyArray<readonly [number, string]> = [
  [2, "rounded-sm"],
  [4, "rounded"],
  [6, "rounded-md"],
  [8, "rounded-lg"],
  [12, "rounded-xl"],
  [16, "rounded-2xl"],
  [24, "rounded-3xl"],
  [9999, "rounded-full"],
]

function nearest(
  table: ReadonlyArray<readonly [number, string]>,
  px: number,
): { cls: string; px: number; exact: boolean } | undefined {
  let best: readonly [number, string] | undefined
  for (const entry of table) {
    if (best === undefined || Math.abs(entry[0] - px) < Math.abs(best[0] - px)) best = entry
  }
  return best && { cls: best[1], px: best[0], exact: best[0] === px }
}

export function parsePx(value: string): number | undefined {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value)
  return match?.[1] !== undefined ? Number(match[1]) : undefined
}

const SPACING_PREFIXES = new Set([
  "m",
  "mt",
  "mb",
  "ml",
  "mr",
  "mx",
  "my",
  "p",
  "pt",
  "pb",
  "pl",
  "pr",
  "px",
  "py",
  "gap",
  "gap-x",
  "gap-y",
  "space-x",
  "space-y",
  "w",
  "h",
  "size",
  "top",
  "bottom",
  "left",
  "right",
  "inset",
  "max-w",
  "max-h",
  "min-w",
  "min-h",
])

/**
 * Suggest the on-scale replacement for an arbitrary utility.
 * "mt-[13px]" -> { cls: "mt-3", exact: false, px: 12 }; "text-[14px]" -> text-sm exact.
 */
export function suggestScaleClass(
  baseClass: string,
): { cls: string; px: number; exact: boolean } | undefined {
  const prefix = arbitraryPrefix(baseClass)
  const value = arbitraryValue(baseClass)
  if (prefix === undefined || value === undefined) return undefined
  const px = parsePx(value)
  if (px === undefined) return undefined
  if (prefix === "text") return nearest(FONT_SIZE_PX, px)
  if (prefix === "rounded" || prefix.startsWith("rounded-")) {
    const hit = nearest(RADIUS_PX, px)
    return hit && { ...hit, cls: hit.cls.replace(/^rounded/, prefix) }
  }
  if (SPACING_PREFIXES.has(prefix)) {
    const hit = nearestSpacingToken(Math.abs(px))
    return hit && { cls: `${prefix}-${hit.token}`, px: hit.px, exact: hit.exact }
  }
  return undefined
}

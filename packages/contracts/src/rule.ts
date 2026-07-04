/** Canonical rule identifiers. Stable across releases — new rules append, never rename. */
export type RuleId =
  | "no-raw-hex"
  | "no-inline-style"
  | "no-arbitrary-tailwind"
  | "no-raw-palette-color"
  | "require-button-component"
  | "require-input-component"
  | "require-dialog-component"
  | "require-card-component"
  | "no-duplicate-components"

export type RuleSeverity = "off" | "warn" | "error"

/** Config keys use camelCase; RuleId uses kebab-case. This maps between them. */
export const RULE_CONFIG_KEYS = {
  "no-raw-hex": "noRawHex",
  "no-inline-style": "noInlineStyle",
  "no-arbitrary-tailwind": "noArbitraryTailwind",
  "no-raw-palette-color": "noRawPaletteColor",
  "require-button-component": "requireButtonComponent",
  "require-input-component": "requireInputComponent",
  "require-dialog-component": "requireDialogComponent",
  "require-card-component": "requireCardComponent",
  "no-duplicate-components": "noDuplicateComponents",
} as const satisfies Record<RuleId, string>

export type RuleConfigKey = (typeof RULE_CONFIG_KEYS)[RuleId]

export const ALL_RULE_IDS: readonly RuleId[] = Object.keys(RULE_CONFIG_KEYS) as RuleId[]

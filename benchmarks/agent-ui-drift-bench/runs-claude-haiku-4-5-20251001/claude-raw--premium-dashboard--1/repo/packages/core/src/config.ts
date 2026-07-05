import fs from "node:fs"
import path from "node:path"
import { parse as parseYaml } from "yaml"
import type {
  ComponentMapping,
  RulesConfig,
  RuleSeverity,
  SnaplineConfig,
} from "@usesnapline/contracts"

export const CONFIG_FILE_NAME = "snapline.yml"

export const DEFAULT_ALLOWED_COLOR_CLASSES: readonly string[] = [
  "bg-background",
  "text-foreground",
  "bg-primary",
  "text-primary-foreground",
  "bg-secondary",
  "text-secondary-foreground",
  "text-muted-foreground",
  "border-border",
  "bg-card",
  "text-card-foreground",
  "bg-destructive",
  "text-destructive-foreground",
]

export const DEFAULT_RULES: RulesConfig = {
  noRawHex: "error",
  noInlineStyle: "error",
  noArbitraryTailwind: "error",
  noRawPaletteColor: "warn",
  requireButtonComponent: "error",
  requireInputComponent: "error",
  requireDialogComponent: "warn",
  requireCardComponent: "warn",
  noDuplicateComponents: "warn",
}

export const DEFAULT_COMPONENTS: Readonly<Record<string, ComponentMapping>> = {
  Button: { import: "@/components/ui/button", preferOver: ["button"] },
  Input: { import: "@/components/ui/input", preferOver: ["input"] },
  Dialog: { import: "@/components/ui/dialog", preferOver: ['div[role="dialog"]'] },
  Card: { import: "@/components/ui/card", preferOver: ["div[data-card]"] },
}

export function defaultConfig(): SnaplineConfig {
  return {
    version: 1,
    stack: { framework: "next", ui: "shadcn", styling: "tailwind" },
    components: DEFAULT_COMPONENTS,
    tokens: {
      colors: { semanticOnly: true, allowed: DEFAULT_ALLOWED_COLOR_CLASSES },
    },
    rules: DEFAULT_RULES,
    fix: { safeAutofix: false, preferAgentRepair: true },
    benchmark: { enabled: true, scorer: "ui-drift-score-v1" },
  }
}

export class ConfigError extends Error {}

const SEVERITIES: readonly RuleSeverity[] = ["off", "warn", "error"]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Parse and validate snapline.yml text. Unknown keys are rejected at the top level. */
export function parseConfig(text: string): SnaplineConfig {
  const raw: unknown = parseYaml(text)
  if (!isRecord(raw)) throw new ConfigError("snapline.yml must be a YAML mapping")
  if (raw.version !== 1) throw new ConfigError(`Unsupported config version: ${String(raw.version)}`)

  const defaults = defaultConfig()
  const knownKeys = new Set([
    "version",
    "stack",
    "components",
    "tokens",
    "rules",
    "fix",
    "benchmark",
  ])
  for (const key of Object.keys(raw)) {
    if (!knownKeys.has(key)) throw new ConfigError(`Unknown top-level config key: ${key}`)
  }

  const stack = isRecord(raw.stack) ? raw.stack : {}
  const components: Record<string, ComponentMapping> = {}
  if (raw.components !== undefined) {
    if (!isRecord(raw.components)) throw new ConfigError("components must be a mapping")
    for (const [name, value] of Object.entries(raw.components)) {
      if (!isRecord(value) || typeof value.import !== "string") {
        throw new ConfigError(`components.${name} requires an "import" string`)
      }
      const preferOver = Array.isArray(value.preferOver)
        ? value.preferOver.map((p) => String(p))
        : []
      components[name] = { import: value.import, preferOver }
    }
  }

  const tokens = isRecord(raw.tokens) ? raw.tokens : {}
  const colors = isRecord(tokens.colors) ? tokens.colors : {}
  const allowed = Array.isArray(colors.allowed)
    ? colors.allowed.map((c) => String(c))
    : defaults.tokens.colors.allowed

  const rules: Record<string, RuleSeverity> = { ...defaults.rules }
  if (raw.rules !== undefined) {
    if (!isRecord(raw.rules)) throw new ConfigError("rules must be a mapping")
    for (const [key, value] of Object.entries(raw.rules)) {
      if (!(key in defaults.rules)) throw new ConfigError(`Unknown rule: ${key}`)
      if (!SEVERITIES.includes(value as RuleSeverity)) {
        throw new ConfigError(`Invalid severity for ${key}: ${String(value)} (use off|warn|error)`)
      }
      rules[key] = value as RuleSeverity
    }
  }

  const fix = isRecord(raw.fix) ? raw.fix : {}
  const benchmark = isRecord(raw.benchmark) ? raw.benchmark : {}

  return {
    version: 1,
    stack: {
      framework: (stack.framework as SnaplineConfig["stack"]["framework"]) ?? "next",
      ui: (stack.ui as SnaplineConfig["stack"]["ui"]) ?? "shadcn",
      styling: "tailwind",
    },
    components: Object.keys(components).length > 0 ? components : defaults.components,
    tokens: {
      colors: {
        semanticOnly: colors.semanticOnly !== false,
        allowed,
      },
    },
    rules: rules as RulesConfig,
    fix: {
      safeAutofix: fix.safeAutofix === true,
      preferAgentRepair: fix.preferAgentRepair !== false,
    },
    benchmark: {
      enabled: benchmark.enabled !== false,
      scorer: "ui-drift-score-v1",
    },
  }
}

/** Load snapline.yml from a project root. Falls back to defaults when absent. */
export function loadConfig(root: string): { config: SnaplineConfig; configPath?: string } {
  const configPath = path.join(root, CONFIG_FILE_NAME)
  if (!fs.existsSync(configPath)) return { config: defaultConfig() }
  return { config: parseConfig(fs.readFileSync(configPath, "utf8")), configPath }
}

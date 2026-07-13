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
    components: DEFAULT_COMPONENTS,
    tokens: {
      colors: { semanticOnly: true, allowed: DEFAULT_ALLOWED_COLOR_CLASSES },
    },
    rules: DEFAULT_RULES,
  }
}

export class ConfigError extends Error {}

const SEVERITIES: readonly RuleSeverity[] = ["off", "warn", "error"]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function section(value: unknown, name: string): Record<string, unknown> {
  if (value === undefined) return {}
  if (!isRecord(value)) throw new ConfigError(`${name} must be a mapping`)
  return value
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  name: string,
): void {
  const known = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!known.has(key)) throw new ConfigError(`Unknown ${name} key: ${key}`)
  }
}

/** Parse and validate snapline.yml text. Unknown keys are rejected at the top level. */
export function parseConfig(text: string): SnaplineConfig {
  const raw: unknown = parseYaml(text)
  if (!isRecord(raw)) throw new ConfigError("snapline.yml must be a YAML mapping")
  if (raw.version !== 1) throw new ConfigError(`Unsupported config version: ${String(raw.version)}`)

  const defaults = defaultConfig()
  const knownKeys = new Set(["version", "components", "tokens", "rules"])
  for (const key of Object.keys(raw)) {
    if (!knownKeys.has(key)) throw new ConfigError(`Unknown top-level config key: ${key}`)
  }

  const components: Record<string, ComponentMapping> = {}
  if (raw.components !== undefined) {
    if (!isRecord(raw.components)) throw new ConfigError("components must be a mapping")
    for (const [name, value] of Object.entries(raw.components)) {
      if (!isRecord(value) || typeof value.import !== "string") {
        throw new ConfigError(`components.${name} requires an "import" string`)
      }
      rejectUnknownKeys(value, ["import", "preferOver"], `components.${name}`)
      if (name.length === 0 || value.import.length === 0) {
        throw new ConfigError("Component names and imports must not be empty")
      }
      if (
        value.preferOver !== undefined &&
        (!Array.isArray(value.preferOver) ||
          value.preferOver.some((entry) => typeof entry !== "string" || entry.length === 0))
      ) {
        throw new ConfigError(`components.${name}.preferOver must be an array of strings`)
      }
      const preferOver = (value.preferOver as string[] | undefined) ?? []
      components[name] = { import: value.import, preferOver }
    }
  }

  const tokens = section(raw.tokens, "tokens")
  rejectUnknownKeys(tokens, ["colors"], "tokens")
  const colors = section(tokens.colors, "tokens.colors")
  rejectUnknownKeys(colors, ["semanticOnly", "allowed"], "tokens.colors")
  if (colors.semanticOnly !== undefined && typeof colors.semanticOnly !== "boolean") {
    throw new ConfigError("tokens.colors.semanticOnly must be a boolean")
  }
  if (
    colors.allowed !== undefined &&
    (!Array.isArray(colors.allowed) ||
      colors.allowed.some((entry) => typeof entry !== "string" || entry.length === 0))
  ) {
    throw new ConfigError("tokens.colors.allowed must be an array of strings")
  }
  const allowed = (colors.allowed as string[] | undefined) ?? defaults.tokens.colors.allowed

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

  return {
    version: 1,
    components: raw.components === undefined ? defaults.components : components,
    tokens: {
      colors: {
        semanticOnly: colors.semanticOnly !== false,
        allowed,
      },
    },
    rules: rules as RulesConfig,
  }
}

/** Load snapline.yml from a project root. Falls back to defaults when absent. */
export function loadConfig(root: string): { config: SnaplineConfig; configPath?: string } {
  const configPath = path.join(root, CONFIG_FILE_NAME)
  if (!fs.existsSync(configPath)) return { config: defaultConfig() }
  return { config: parseConfig(fs.readFileSync(configPath, "utf8")), configPath }
}

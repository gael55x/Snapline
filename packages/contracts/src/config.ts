import type { RuleConfigKey, RuleSeverity } from "./rule.js"

export interface StackConfig {
  readonly framework: "next" | "vite" | "remix" | "other"
  readonly ui: "shadcn" | "custom"
  readonly styling: "tailwind"
}

/** One design-system component the project prefers over raw primitives. */
export interface ComponentMapping {
  /** Import specifier, e.g. "@/components/ui/button". */
  readonly import: string
  /** Raw elements/patterns this component replaces, e.g. ["button"] or ["div[role=\"dialog\"]"]. */
  readonly preferOver: readonly string[]
}

export interface TokenColorConfig {
  /** When true, only classes in `allowed` (plus their hover:/focus: etc. variants) pass. */
  readonly semanticOnly: boolean
  /** Allowed semantic color utility classes, e.g. "bg-primary". */
  readonly allowed: readonly string[]
}

export interface TokenConfig {
  readonly colors: TokenColorConfig
}

export type RulesConfig = Readonly<Record<RuleConfigKey, RuleSeverity>>

export interface FixConfig {
  /** Apply safe autofixes automatically during hook runs. Default false. */
  readonly safeAutofix: boolean
  /** Prefer returning a repair contract for the agent over autofixing. Default true. */
  readonly preferAgentRepair: boolean
}

export interface BenchmarkConfig {
  readonly enabled: boolean
  readonly scorer: "ui-drift-score-v1"
}

/** Parsed snapline.yml. */
export interface SnaplineConfig {
  readonly version: 1
  readonly stack: StackConfig
  readonly components: Readonly<Record<string, ComponentMapping>>
  readonly tokens: TokenConfig
  readonly rules: RulesConfig
  readonly fix: FixConfig
  readonly benchmark: BenchmarkConfig
}

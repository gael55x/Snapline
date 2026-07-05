import type { RepairContract } from "./repair-contract.js"

export type HookAgent = "claude" | "codex" | "cursor"
export type HookKind = "post-tool-use" | "stop"

/**
 * Normalized hook event. Adapters translate agent-specific stdin payloads
 * (Claude PostToolUse/Stop JSON, Codex events) into this shape; core never
 * sees agent-specific fields.
 */
export interface HookEvent {
  readonly agent: HookAgent
  readonly kind: HookKind
  readonly cwd: string
  /** Files the event concerns. Empty for stop events (adapter falls back to git diff). */
  readonly filePaths: readonly string[]
  /** Agent-specific tool name when available, e.g. "Write" | "Edit" | "MultiEdit". */
  readonly toolName?: string
  /** True when a stop hook already fired once for this stop (loop guard). */
  readonly stopAlreadyRetried?: boolean
}

export type HookAction = "allow" | "warn" | "block"

export interface HookDecision {
  readonly action: HookAction
  /** Message for the agent — the repair contract text when action is warn/block. */
  readonly agentMessage?: string
  readonly contracts: readonly RepairContract[]
}

export interface PluginMetadata {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly homepage: string
  readonly repository: string
  readonly license: string
  readonly keywords: readonly string[]
}

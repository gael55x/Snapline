import fs from "node:fs"
import path from "node:path"

/**
 * Hook entries written into .claude/settings.json. The commands call the
 * Snapline CLI, which reads the official hook payload from stdin.
 * Reference: https://code.claude.com/docs/en/hooks
 */
export const CLAUDE_HOOKS_SETTINGS = {
  PostToolUse: [
    {
      matcher: "Write|Edit|MultiEdit",
      hooks: [{ type: "command", command: "snapline hook claude post-tool-use" }],
    },
  ],
  Stop: [
    {
      hooks: [{ type: "command", command: "snapline hook claude stop" }],
    },
  ],
} as const

interface SettingsShape {
  hooks?: Record<string, unknown[]>
  [key: string]: unknown
}

export interface InstallResult {
  readonly settingsPath: string
  readonly changed: boolean
}

function hasSnaplineHook(entries: unknown[]): boolean {
  return JSON.stringify(entries).includes("snapline hook claude")
}

/**
 * Merge Snapline hooks into <root>/.claude/settings.json without touching
 * unrelated settings or existing hooks. Idempotent.
 */
export function installClaudeHooks(root: string): InstallResult {
  const dir = path.join(root, ".claude")
  const settingsPath = path.join(dir, "settings.json")
  let settings: SettingsShape = {}
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as SettingsShape
  }
  const hooks = (settings.hooks ??= {})
  let changed = false
  for (const [event, entries] of Object.entries(CLAUDE_HOOKS_SETTINGS)) {
    const existing = (hooks[event] ??= [])
    if (!hasSnaplineHook(existing)) {
      existing.push(...entries)
      changed = true
    }
  }
  if (changed) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n")
  }
  return { settingsPath, changed }
}

/** True when Snapline hooks are present in the project's Claude settings. */
export function claudeHooksInstalled(root: string): boolean {
  const settingsPath = path.join(root, ".claude", "settings.json")
  if (!fs.existsSync(settingsPath)) return false
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as SettingsShape
    const hooks = settings.hooks ?? {}
    return hasSnaplineHook(hooks.PostToolUse ?? []) && hasSnaplineHook(hooks.Stop ?? [])
  } catch {
    return false
  }
}

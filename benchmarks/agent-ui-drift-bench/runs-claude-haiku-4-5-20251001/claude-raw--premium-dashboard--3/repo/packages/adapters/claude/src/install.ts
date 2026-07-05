import fs from "node:fs"
import path from "node:path"

/**
 * Hook entries written into .claude/settings.json. The commands call the
 * Snapline CLI, which reads the official hook payload from stdin.
 * Reference: https://code.claude.com/docs/en/hooks
 *
 * Hook commands run in a plain shell where a project-local node_modules/.bin
 * is NOT on PATH, so when the project has a local install we go through
 * `npx --no-install`; a bare `snapline` is only written for global installs.
 */
function hookCommands(root: string): { postToolUse: string; stop: string } {
  const hasLocalInstall = fs.existsSync(path.join(root, "node_modules", ".bin", "snapline"))
  const bin = hasLocalInstall ? "npx --no-install snapline" : "snapline"
  return {
    postToolUse: `${bin} hook claude post-tool-use`,
    stop: `${bin} hook claude stop`,
  }
}

export function claudeHooksSettings(root: string): {
  PostToolUse: unknown[]
  Stop: unknown[]
} {
  const commands = hookCommands(root)
  return {
    PostToolUse: [
      {
        matcher: "Write|Edit|MultiEdit",
        hooks: [{ type: "command", command: commands.postToolUse }],
      },
    ],
    Stop: [
      {
        hooks: [{ type: "command", command: commands.stop }],
      },
    ],
  }
}

/** Default hook entries (global-install form). Kept for reference and docs. */
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
  for (const [event, entries] of Object.entries(claudeHooksSettings(root))) {
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

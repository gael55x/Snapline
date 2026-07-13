import fs from "node:fs"
import path from "node:path"

interface HooksFile {
  hooks?: Record<string, unknown[]>
  [key: string]: unknown
}

function hookCommand(root: string, kind: "post-tool-use" | "stop"): string {
  const local = fs.existsSync(path.join(root, "node_modules", ".bin", "snapline"))
  const bin = local ? "npx --no-install snapline" : "snapline"
  return `${bin} hook codex ${kind}`
}

function codexHooks(root: string): Record<string, unknown[]> {
  return {
    PostToolUse: [
      {
        matcher: "Edit|Write",
        hooks: [
          {
            type: "command",
            command: hookCommand(root, "post-tool-use"),
            statusMessage: "Checking UI drift",
            timeout: 30,
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            type: "command",
            command: hookCommand(root, "stop"),
            statusMessage: "Checking UI drift",
            timeout: 30,
          },
        ],
      },
    ],
  }
}

function hasSnaplineHook(entries: unknown[]): boolean {
  return JSON.stringify(entries).includes("snapline hook codex")
}

export interface CodexInstallResult {
  readonly hooksPath: string
  readonly changed: boolean
}

/** Merge Snapline into the official project-local Codex hooks file. */
export function installCodex(root: string): CodexInstallResult {
  const hooksPath = path.join(root, ".codex", "hooks.json")
  const document: HooksFile = fs.existsSync(hooksPath)
    ? (JSON.parse(fs.readFileSync(hooksPath, "utf8")) as HooksFile)
    : {}
  const hooks = (document.hooks ??= {})
  let changed = false
  for (const [event, entries] of Object.entries(codexHooks(root))) {
    const existing = (hooks[event] ??= [])
    if (!hasSnaplineHook(existing)) {
      existing.push(...entries)
      changed = true
    }
  }
  if (changed) {
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true })
    fs.writeFileSync(hooksPath, JSON.stringify(document, null, 2) + "\n")
  }
  return { hooksPath, changed }
}

/** True when both Snapline lifecycle hooks are installed for this project. */
export function codexHooksInstalled(root: string): boolean {
  const hooksPath = path.join(root, ".codex", "hooks.json")
  if (!fs.existsSync(hooksPath)) return false
  try {
    const document = JSON.parse(fs.readFileSync(hooksPath, "utf8")) as HooksFile
    const hooks = document.hooks ?? {}
    return hasSnaplineHook(hooks.PostToolUse ?? []) && hasSnaplineHook(hooks.Stop ?? [])
  } catch {
    return false
  }
}

/** Remove only Snapline-owned entries from project Codex hooks. */
export function uninstallCodex(root: string): CodexInstallResult {
  const hooksPath = path.join(root, ".codex", "hooks.json")
  if (!fs.existsSync(hooksPath)) return { hooksPath, changed: false }
  const document = JSON.parse(fs.readFileSync(hooksPath, "utf8")) as HooksFile
  const hooks = document.hooks ?? {}
  let changed = false
  for (const [event, entries] of Object.entries(hooks)) {
    const retained = entries.filter((entry) => !hasSnaplineHook([entry]))
    if (retained.length !== entries.length) {
      changed = true
      if (retained.length === 0) delete hooks[event]
      else hooks[event] = retained
    }
  }
  if (changed) fs.writeFileSync(hooksPath, JSON.stringify(document, null, 2) + "\n")
  return { hooksPath, changed }
}

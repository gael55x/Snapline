import fs from "node:fs"
import path from "node:path"

const RULE_CONTENT = `---
description: Snapline keeps AI-generated UI on-system
alwaysApply: true
---

This project uses Snapline (https://github.com/gael55x/Snapline).

Honor every SNAPLINE FOUND UI DRIFT repair contract before finishing. Run
\`snapline scan --changed\` to verify repairs.
`

interface CursorHooksFile {
  version: 1
  hooks: Record<string, unknown[]>
}

function hookCommand(root: string, kind: "post-tool-use" | "stop"): string {
  const local = fs.existsSync(path.join(root, "node_modules", ".bin", "snapline"))
  const bin = local ? "npx --no-install snapline" : "snapline"
  return `${bin} hook cursor ${kind}`
}

function hasSnaplineHook(entries: unknown[]): boolean {
  return JSON.stringify(entries).includes("snapline hook cursor")
}

export interface CursorInstallResult {
  readonly rulePath: string
  readonly hooksPath: string
  readonly changed: boolean
}

/** Install Cursor project rules plus the official postToolUse and stop hooks. */
export function installCursor(root: string): CursorInstallResult {
  const rulePath = path.join(root, ".cursor", "rules", "snapline.mdc")
  const hooksPath = path.join(root, ".cursor", "hooks.json")
  fs.mkdirSync(path.dirname(rulePath), { recursive: true })
  let changed = !fs.existsSync(rulePath) || fs.readFileSync(rulePath, "utf8") !== RULE_CONTENT
  if (changed) fs.writeFileSync(rulePath, RULE_CONTENT)

  const document: CursorHooksFile = fs.existsSync(hooksPath)
    ? (JSON.parse(fs.readFileSync(hooksPath, "utf8")) as CursorHooksFile)
    : { version: 1, hooks: {} }
  if (document.version !== 1 || typeof document.hooks !== "object" || document.hooks === null) {
    throw new Error(".cursor/hooks.json must use version 1 with a hooks object")
  }
  const desired: Record<string, unknown[]> = {
    postToolUse: [{ command: hookCommand(root, "post-tool-use"), matcher: "Write|Edit" }],
    stop: [{ command: hookCommand(root, "stop"), loop_limit: 1 }],
  }
  for (const [event, entries] of Object.entries(desired)) {
    const existing = (document.hooks[event] ??= [])
    if (!hasSnaplineHook(existing)) {
      existing.push(...entries)
      changed = true
    }
  }
  if (changed) fs.writeFileSync(hooksPath, JSON.stringify(document, null, 2) + "\n")
  return { rulePath, hooksPath, changed }
}

/** True when both Snapline lifecycle hooks are installed for this project. */
export function cursorHooksInstalled(root: string): boolean {
  const hooksPath = path.join(root, ".cursor", "hooks.json")
  if (!fs.existsSync(hooksPath)) return false
  try {
    const document = JSON.parse(fs.readFileSync(hooksPath, "utf8")) as CursorHooksFile
    return (
      document.version === 1 &&
      hasSnaplineHook(document.hooks?.postToolUse ?? []) &&
      hasSnaplineHook(document.hooks?.stop ?? [])
    )
  } catch {
    return false
  }
}

/** Remove Snapline-owned hooks and the unchanged Snapline rule file. */
export function uninstallCursor(root: string): CursorInstallResult {
  const rulePath = path.join(root, ".cursor", "rules", "snapline.mdc")
  const hooksPath = path.join(root, ".cursor", "hooks.json")
  let changed = false
  if (fs.existsSync(rulePath) && fs.readFileSync(rulePath, "utf8") === RULE_CONTENT) {
    fs.unlinkSync(rulePath)
    changed = true
  }
  if (fs.existsSync(hooksPath)) {
    const document = JSON.parse(fs.readFileSync(hooksPath, "utf8")) as CursorHooksFile
    if (document.version !== 1 || typeof document.hooks !== "object" || document.hooks === null) {
      throw new Error(".cursor/hooks.json must use version 1 with a hooks object")
    }
    let hooksChanged = false
    for (const [event, entries] of Object.entries(document.hooks)) {
      const retained = entries.filter((entry) => !hasSnaplineHook([entry]))
      if (retained.length !== entries.length) {
        changed = true
        hooksChanged = true
        if (retained.length === 0) delete document.hooks[event]
        else document.hooks[event] = retained
      }
    }
    if (hooksChanged) fs.writeFileSync(hooksPath, JSON.stringify(document, null, 2) + "\n")
  }
  return { rulePath, hooksPath, changed }
}

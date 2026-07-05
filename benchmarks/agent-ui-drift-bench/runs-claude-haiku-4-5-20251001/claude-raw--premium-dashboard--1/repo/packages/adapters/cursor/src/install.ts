import fs from "node:fs"
import path from "node:path"

const RULE_CONTENT = `---
description: Snapline keeps AI-generated UI on-system
alwaysApply: true
---

This project uses Snapline (https://github.com/gael55x/Snapline).

After editing any .tsx file, run \`snapline scan --changed\` and repair every
error the SNAPLINE FOUND UI DRIFT contract lists before finishing:

- Never use raw hex colors, inline style objects, or arbitrary Tailwind values.
- Never use raw palette classes (bg-blue-500); use semantic tokens (bg-primary).
- Use the project's shadcn components (Button, Input, Dialog, Card) instead of
  raw primitives.
`

export interface CursorInstallResult {
  readonly rulePath: string
  readonly changed: boolean
}

/**
 * Cursor install (experimental): Cursor has no stable lifecycle-hook API, so
 * installation writes a project rule that instructs the agent to run the
 * scanner and honor repair contracts. Enforcement is instruction-level, not a
 * hard gate — see docs/cursor.md.
 */
export function installCursor(root: string): CursorInstallResult {
  const rulePath = path.join(root, ".cursor", "rules", "snapline.mdc")
  if (fs.existsSync(rulePath) && fs.readFileSync(rulePath, "utf8") === RULE_CONTENT) {
    return { rulePath, changed: false }
  }
  fs.mkdirSync(path.dirname(rulePath), { recursive: true })
  fs.writeFileSync(rulePath, RULE_CONTENT)
  return { rulePath, changed: true }
}

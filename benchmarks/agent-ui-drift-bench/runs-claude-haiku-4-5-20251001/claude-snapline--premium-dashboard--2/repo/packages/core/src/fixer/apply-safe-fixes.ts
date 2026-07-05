import fs from "node:fs"
import path from "node:path"
import type { FixPlan } from "./types.js"
import { applyEdits } from "./types.js"

export interface AppliedFix {
  readonly filePath: string
  readonly descriptions: readonly string[]
}

/** Apply a fix plan to disk. With dryRun, report what would change without writing. */
export function applySafeFixes(root: string, plan: FixPlan, dryRun = false): AppliedFix[] {
  const applied: AppliedFix[] = []
  for (const file of plan.files) {
    const absolute = path.join(root, file.filePath)
    if (!fs.existsSync(absolute)) continue
    const before = fs.readFileSync(absolute, "utf8")
    const after = applyEdits(before, file.edits)
    if (after === before) continue
    if (!dryRun) fs.writeFileSync(absolute, after)
    applied.push({ filePath: file.filePath, descriptions: file.edits.map((e) => e.description) })
  }
  return applied
}

import fs from "node:fs"
import path from "node:path"

const AGENTS_MD_SECTION = `
## Snapline (UI drift)

This project uses Snapline to keep AI-generated UI on-system.

- After editing any .tsx file, run: \`snapline scan --changed\`
- Before finishing, run it again. Do not finish while it reports errors.
- Repair exactly what the SNAPLINE FOUND UI DRIFT contract says.
`

export interface CodexInstallResult {
  readonly agentsMdPath: string
  readonly changed: boolean
}

/**
 * Codex install (beta): Codex has no stable hook API yet, so installation adds
 * a Snapline section to AGENTS.md — the instruction file Codex reads — telling
 * the agent to run the scanner and honor repair contracts. When Codex ships
 * lifecycle hooks, this adapter will register them instead.
 */
export function installCodex(root: string): CodexInstallResult {
  const agentsMdPath = path.join(root, "AGENTS.md")
  const existing = fs.existsSync(agentsMdPath) ? fs.readFileSync(agentsMdPath, "utf8") : ""
  if (existing.includes("## Snapline (UI drift)")) {
    return { agentsMdPath, changed: false }
  }
  const next =
    existing.length > 0
      ? existing.replace(/\n*$/, "\n") + AGENTS_MD_SECTION
      : `# Agent instructions\n${AGENTS_MD_SECTION}`
  fs.writeFileSync(agentsMdPath, next)
  return { agentsMdPath, changed: true }
}

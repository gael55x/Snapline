import fs from "node:fs"
import path from "node:path"

const CSS_CANDIDATES = [
  "src/app/globals.css",
  "app/globals.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/index.css",
]

export interface CssVarsInfo {
  readonly cssPath?: string
  /** Custom property names declared in the theme, e.g. ["--background", "--primary"]. */
  readonly variables: readonly string[]
}

/** Extract CSS custom property names from the project's global stylesheet. */
export function readCssVars(root: string, explicitPath?: string): CssVarsInfo {
  const candidates = explicitPath ? [explicitPath, ...CSS_CANDIDATES] : CSS_CANDIDATES
  const cssPath = candidates.map((c) => path.join(root, c)).find((p) => fs.existsSync(p))
  if (cssPath === undefined) return { variables: [] }
  const text = fs.readFileSync(cssPath, "utf8")
  const variables = new Set<string>()
  for (const match of text.matchAll(/(--[a-zA-Z][a-zA-Z0-9-]*)\s*:/g)) {
    if (match[1] !== undefined) variables.add(match[1])
  }
  return { cssPath: path.relative(root, cssPath), variables: [...variables].sort() }
}

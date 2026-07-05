import fs from "node:fs"
import path from "node:path"

const CANDIDATES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
]

export interface TailwindInfo {
  readonly configPath?: string
  /** Extended color token names found in the config text, e.g. ["primary", "brand"]. */
  readonly extendedColorNames: readonly string[]
}

/**
 * Detect the Tailwind config and extract extended color token names.
 * The config is read as text, never executed — Snapline stays deterministic
 * and dependency-free. Tailwind v4 projects (CSS-first, no config file) are
 * handled via read-css-vars instead.
 */
export function readTailwindConfig(root: string): TailwindInfo {
  const configPath = CANDIDATES.map((c) => path.join(root, c)).find((p) => fs.existsSync(p))
  if (configPath === undefined) return { extendedColorNames: [] }
  const text = fs.readFileSync(configPath, "utf8")
  const colorsBlock = /colors\s*:\s*\{([\s\S]*?)\n\s*\}\s*,?\s*\n/.exec(text)
  const names = new Set<string>()
  if (colorsBlock?.[1] !== undefined) {
    for (const match of colorsBlock[1].matchAll(/^\s*"?([a-zA-Z][a-zA-Z0-9-]*)"?\s*:/gm)) {
      const name = match[1]
      if (name !== undefined && name !== "DEFAULT" && name !== "foreground") names.add(name)
    }
  }
  return { configPath: path.relative(root, configPath), extendedColorNames: [...names].sort() }
}

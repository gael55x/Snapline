import fs from "node:fs"
import path from "node:path"
import { readComponentsJson, type ComponentsJson } from "./read-components-json.js"
import { readTsconfigPaths } from "./read-tsconfig-paths.js"
import { readTailwindConfig, type TailwindInfo } from "./read-tailwind-config.js"
import { readCssVars, type CssVarsInfo } from "./read-css-vars.js"

export interface ProjectInfo {
  readonly root: string
  readonly hasNext: boolean
  readonly hasTailwind: boolean
  readonly componentsJson?: ComponentsJson
  /** Project-root-relative path to the shadcn ui directory, e.g. "src/components/ui". */
  readonly uiDir?: string
  readonly tsconfigPaths: Record<string, readonly string[]>
  readonly tailwind: TailwindInfo
  readonly cssVars: CssVarsInfo
}

function readPackageDeps(root: string): Set<string> {
  const file = path.join(root, "package.json")
  if (!fs.existsSync(file)) return new Set()
  try {
    const pkg = JSON.parse(fs.readFileSync(file, "utf8")) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ])
  } catch {
    return new Set()
  }
}

const UI_DIR_CANDIDATES = ["src/components/ui", "components/ui", "app/components/ui"]

export function detectProject(root: string): ProjectInfo {
  const deps = readPackageDeps(root)
  const componentsJson = readComponentsJson(root)
  const tailwind = readTailwindConfig(root)
  const cssVars = readCssVars(root, componentsJson?.tailwind?.css)
  const tsconfigPaths = readTsconfigPaths(root)

  const uiDir = UI_DIR_CANDIDATES.find((c) => fs.existsSync(path.join(root, c)))

  return {
    root,
    hasNext: deps.has("next") || fs.existsSync(path.join(root, "next.config.js")),
    hasTailwind:
      deps.has("tailwindcss") || tailwind.configPath !== undefined || cssVars.variables.length > 0,
    componentsJson,
    uiDir,
    tsconfigPaths,
    tailwind,
    cssVars,
  }
}

import fs from "node:fs"
import path from "node:path"
import type {
  ComponentRegistry,
  ComponentRegistryEntry,
  SnaplineConfig,
} from "@usesnapline/contracts"
import { resolveAlias } from "../project/read-tsconfig-paths.js"

const RESOLVE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.jsx", "/index.js"]

/**
 * Build the component registry from config. A component only participates in
 * require-* rules when its import path resolves to a real file — Snapline never
 * demands a component the project does not have.
 */
export function buildComponentRegistry(
  config: SnaplineConfig,
  root: string,
  tsconfigPaths: Record<string, readonly string[]>,
  uiDir?: string,
): ComponentRegistry {
  const components: ComponentRegistryEntry[] = []
  for (const [name, mapping] of Object.entries(config.components)) {
    const resolved = resolveAlias(mapping.import, tsconfigPaths) ?? mapping.import
    const fileExists = RESOLVE_EXTENSIONS.some((ext) =>
      fs.existsSync(path.join(root, resolved + ext)),
    )
    components.push({
      name,
      importPath: mapping.import,
      preferOver: mapping.preferOver,
      fileExists,
    })
  }
  return { components, uiDir }
}

export function registryComponent(
  registry: ComponentRegistry,
  name: string,
): ComponentRegistryEntry | undefined {
  return registry.components.find((c) => c.name === name && c.fileExists)
}

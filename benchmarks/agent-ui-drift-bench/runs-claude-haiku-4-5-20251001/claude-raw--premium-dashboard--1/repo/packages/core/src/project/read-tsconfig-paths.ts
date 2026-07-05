import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

/**
 * Read `compilerOptions.paths` from tsconfig.json, falling back to
 * jsconfig.json — JavaScript Next.js projects declare aliases there.
 */
export function readTsconfigPaths(root: string): Record<string, readonly string[]> {
  const file = [path.join(root, "tsconfig.json"), path.join(root, "jsconfig.json")].find((p) =>
    fs.existsSync(p),
  )
  if (file === undefined) return {}
  const result = ts.readConfigFile(file, (p) => fs.readFileSync(p, "utf8"))
  if (result.error || typeof result.config !== "object" || result.config === null) return {}
  const options = (result.config as { compilerOptions?: { paths?: unknown } }).compilerOptions
  const paths = options?.paths
  if (typeof paths !== "object" || paths === null) return {}
  const out: Record<string, readonly string[]> = {}
  for (const [alias, targets] of Object.entries(paths)) {
    if (Array.isArray(targets)) out[alias] = targets.map((t) => String(t))
  }
  return out
}

/**
 * Resolve an aliased import specifier to a project-root-relative path (without extension).
 * Example: "@/components/ui/button" with { "@/*": ["./src/*"] } -> "src/components/ui/button".
 */
export function resolveAlias(
  specifier: string,
  paths: Record<string, readonly string[]>,
): string | undefined {
  for (const [alias, targets] of Object.entries(paths)) {
    const target = targets[0]
    if (target === undefined) continue
    if (alias.endsWith("/*") && specifier.startsWith(alias.slice(0, -1))) {
      const rest = specifier.slice(alias.length - 1)
      return path.normalize(target.replace(/\*$/, "") + rest).replace(/^\.\//, "")
    }
    if (alias === specifier) return path.normalize(target).replace(/^\.\//, "")
  }
  return undefined
}

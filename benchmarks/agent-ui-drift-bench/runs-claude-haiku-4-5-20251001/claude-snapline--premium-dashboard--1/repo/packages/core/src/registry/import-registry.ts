import type { ComponentRegistry } from "@usesnapline/contracts"

/** Map from import specifier to the design-system component names it provides. */
export function buildImportRegistry(
  registry: ComponentRegistry,
): ReadonlyMap<string, readonly string[]> {
  const map = new Map<string, string[]>()
  for (const component of registry.components) {
    if (!component.fileExists) continue
    const existing = map.get(component.importPath) ?? []
    existing.push(component.name)
    map.set(component.importPath, existing)
  }
  return map
}

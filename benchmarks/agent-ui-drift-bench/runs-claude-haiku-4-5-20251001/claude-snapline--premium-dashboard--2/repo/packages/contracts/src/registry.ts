export interface ComponentRegistryEntry {
  /** Component name as used in JSX, e.g. "Button". */
  readonly name: string
  /** Import specifier, e.g. "@/components/ui/button". */
  readonly importPath: string
  /** Raw elements/patterns this component replaces. */
  readonly preferOver: readonly string[]
  /** True when the import path resolves to a real file in the project. */
  readonly fileExists: boolean
}

export interface ComponentRegistry {
  readonly components: readonly ComponentRegistryEntry[]
  /** Project-root-relative directory holding design-system components, e.g. "src/components/ui". */
  readonly uiDir?: string
}

export interface TokenRegistry {
  readonly semanticOnly: boolean
  /** Allowed semantic color utility classes, e.g. "bg-primary". */
  readonly allowedColorClasses: readonly string[]
  /** CSS custom properties found in the project theme, e.g. "--primary". */
  readonly cssVariables: readonly string[]
}

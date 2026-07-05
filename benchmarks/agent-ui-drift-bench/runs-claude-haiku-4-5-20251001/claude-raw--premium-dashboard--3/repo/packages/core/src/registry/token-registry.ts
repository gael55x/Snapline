import type { SnaplineConfig, TokenRegistry } from "@usesnapline/contracts"

/** Build the token registry from config plus CSS variables discovered in the project. */
export function buildTokenRegistry(
  config: SnaplineConfig,
  cssVariables: readonly string[] = [],
): TokenRegistry {
  return {
    semanticOnly: config.tokens.colors.semanticOnly,
    allowedColorClasses: [...config.tokens.colors.allowed],
    cssVariables: [...cssVariables],
  }
}

/** True when a base utility class (variants and /opacity already stripped) is an allowed token class. */
export function isAllowedColorClass(registry: TokenRegistry, baseClass: string): boolean {
  const withoutOpacity = baseClass.replace(/\/\d{1,3}$/, "")
  return registry.allowedColorClasses.includes(withoutOpacity)
}

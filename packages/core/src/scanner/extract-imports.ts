import ts from "typescript"

export interface ImportInfo {
  readonly source: string
  /** Named imports plus the default import when present. */
  readonly names: readonly string[]
  readonly start: number
  readonly end: number
}

export function extractImports(sourceFile: ts.SourceFile): readonly ImportInfo[] {
  const out: ImportInfo[] = []
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    const names: string[] = []
    const clause = statement.importClause
    if (clause?.name !== undefined) names.push(clause.name.text)
    if (clause?.namedBindings !== undefined && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) names.push(element.name.text)
    }
    out.push({
      source: statement.moduleSpecifier.text,
      names,
      start: statement.getStart(sourceFile),
      end: statement.getEnd(),
    })
  }
  return out
}

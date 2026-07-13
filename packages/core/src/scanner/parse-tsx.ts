import ts from "typescript"

/** Parse TSX/JSX source deterministically. Never executes project code. */
export function parseTsx(fileName: string, sourceText: string): ts.SourceFile {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    fileName.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TSX,
  )
  const parseDiagnostics = (
    sourceFile as ts.SourceFile & { readonly parseDiagnostics?: readonly ts.Diagnostic[] }
  ).parseDiagnostics
  const diagnostic = parseDiagnostics?.[0]
  if (diagnostic !== undefined) {
    const position = diagnostic.start ?? 0
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(position)
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
    throw new SyntaxError(`${fileName}:${line + 1}:${character + 1}: ${message}`)
  }
  return sourceFile
}

export interface SourcePosition {
  readonly line: number
  readonly column: number
}

/** 1-based line/column for an absolute character offset. */
export function positionAt(sourceFile: ts.SourceFile, offset: number): SourcePosition {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(offset)
  return { line: line + 1, column: character + 1 }
}

import ts from "typescript"

/** Parse TSX/JSX source deterministically. Never executes project code. */
export function parseTsx(fileName: string, sourceText: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    fileName.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TSX,
  )
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

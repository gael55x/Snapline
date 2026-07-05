import type {
  ComponentRegistry,
  SnaplineConfig,
  TokenRegistry,
  Violation,
} from "@usesnapline/contracts"
import { parseTsx } from "./parse-tsx.js"
import { extractClassNames } from "./extract-classnames.js"
import { extractJsxElements, type JsxElementInfo } from "./extract-jsx-elements.js"
import { extractInlineStyles } from "./extract-inline-styles.js"
import { extractImports } from "./extract-imports.js"
import { FILE_RULES, finalizeViolations } from "../rules/index.js"
import type { FileScanContext, RuleViolationDraft } from "../rules/context.js"

export interface ScanFileDeps {
  readonly config: SnaplineConfig
  readonly componentRegistry: ComponentRegistry
  readonly tokenRegistry: TokenRegistry
}

export interface FileScanOutcome {
  readonly violations: readonly Violation[]
  /** Elements are surfaced for project-level scoring (component reuse rate). */
  readonly elements: readonly JsxElementInfo[]
}

export function isUiSourcePath(filePath: string, uiDir: string | undefined): boolean {
  return uiDir !== undefined && (filePath === uiDir || filePath.startsWith(uiDir + "/"))
}

/** Scan one TSX/JSX file. Pure with respect to the given source text. */
export function scanFile(
  filePath: string,
  sourceText: string,
  deps: ScanFileDeps,
): FileScanOutcome {
  const sourceFile = parseTsx(filePath, sourceText)
  const ctx: FileScanContext = {
    filePath,
    sourceText,
    sourceFile,
    classes: extractClassNames(sourceFile),
    elements: extractJsxElements(sourceFile),
    inlineStyles: extractInlineStyles(sourceFile),
    imports: extractImports(sourceFile),
    config: deps.config,
    componentRegistry: deps.componentRegistry,
    tokenRegistry: deps.tokenRegistry,
    isUiSource: isUiSourcePath(filePath, deps.componentRegistry.uiDir),
  }
  const drafts: RuleViolationDraft[] = []
  for (const rule of FILE_RULES) drafts.push(...rule(ctx))
  return { violations: finalizeViolations(drafts, ctx), elements: ctx.elements }
}

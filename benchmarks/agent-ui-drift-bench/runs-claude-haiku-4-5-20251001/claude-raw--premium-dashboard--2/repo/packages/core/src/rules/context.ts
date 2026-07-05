import type {
  ComponentRegistry,
  RuleId,
  RuleSeverity,
  SnaplineConfig,
  TokenRegistry,
  Violation,
} from "@usesnapline/contracts"
import { RULE_CONFIG_KEYS } from "@usesnapline/contracts"
import type ts from "typescript"
import type { ExtractedClass } from "../scanner/extract-classnames.js"
import type { JsxElementInfo } from "../scanner/extract-jsx-elements.js"
import type { InlineStyleInfo } from "../scanner/extract-inline-styles.js"
import type { ImportInfo } from "../scanner/extract-imports.js"

/** Everything a file-level rule may look at. Rules are pure: context in, violations out. */
export interface FileScanContext {
  /** Project-root-relative path. */
  readonly filePath: string
  readonly sourceText: string
  readonly sourceFile: ts.SourceFile
  readonly classes: readonly ExtractedClass[]
  readonly elements: readonly JsxElementInfo[]
  readonly inlineStyles: readonly InlineStyleInfo[]
  readonly imports: readonly ImportInfo[]
  readonly config: SnaplineConfig
  readonly componentRegistry: ComponentRegistry
  readonly tokenRegistry: TokenRegistry
  /** True when the file lives inside the design-system ui directory itself. */
  readonly isUiSource: boolean
}

export type FileRule = (ctx: FileScanContext) => readonly RuleViolationDraft[]

/** A violation before id/severity assignment (the engine fills those in). */
export interface RuleViolationDraft {
  readonly ruleId: RuleId
  readonly message: string
  readonly evidence: string
  readonly line?: number
  readonly column?: number
  readonly instruction: string
  readonly safeFix: boolean
  readonly replacement?: string
}

export function severityFor(config: SnaplineConfig, ruleId: RuleId): RuleSeverity {
  return config.rules[RULE_CONFIG_KEYS[ruleId]]
}

export function finalizeViolations(
  drafts: readonly RuleViolationDraft[],
  ctx: Pick<FileScanContext, "filePath" | "config">,
): Violation[] {
  const out: Violation[] = []
  const seen = new Map<string, number>()
  for (const draft of drafts) {
    const severity = severityFor(ctx.config, draft.ruleId)
    if (severity === "off") continue
    const locationKey = `${draft.ruleId}:${ctx.filePath}:${draft.line ?? 0}:${draft.column ?? 0}`
    const n = (seen.get(locationKey) ?? 0) + 1
    seen.set(locationKey, n)
    out.push({
      id: `${locationKey}:${n}`,
      ruleId: draft.ruleId,
      severity,
      filePath: ctx.filePath,
      message: draft.message,
      location:
        draft.line !== undefined ? { line: draft.line, column: draft.column ?? 1 } : undefined,
      evidence: draft.evidence,
      repair: {
        instruction: draft.instruction,
        safeFix: draft.safeFix,
        replacement: draft.replacement,
      },
    })
  }
  return out
}

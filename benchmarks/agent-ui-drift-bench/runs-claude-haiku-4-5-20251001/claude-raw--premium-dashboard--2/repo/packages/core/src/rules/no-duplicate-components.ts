import path from "node:path"
import type { ComponentRegistry, SnaplineConfig, Violation } from "@usesnapline/contracts"
import { registryComponent } from "../registry/component-registry.js"
import { finalizeViolations, type RuleViolationDraft } from "./context.js"

const PREFIXES = "(Custom|Primary|Secondary|Base|App|My|New|Simple|Styled)"
const KINDS = "(Button|Input|Modal|Dialog|Card|Select|Textarea|Badge)"
const DUPLICATE_NAME_RE = new RegExp(`^${PREFIXES}${KINDS}\\.tsx$`)
const SUFFIX_NAME_RE = new RegExp(`^${KINDS}(Component|Wrapper)\\.tsx$`)

/** Modal duplicates the Dialog system component. */
const KIND_TO_REGISTRY: Readonly<Record<string, string>> = {
  Button: "Button",
  Input: "Input",
  Modal: "Dialog",
  Dialog: "Dialog",
  Card: "Card",
  Select: "Select",
  Textarea: "Textarea",
  Badge: "Badge",
}

/**
 * no-duplicate-components: project-level rule. Files like CustomButton.tsx,
 * BaseModal.tsx, AppInput.tsx that duplicate an existing design-system
 * component. Name-based and prefix-restricted on purpose: IconButton.tsx or
 * SubmitButton.tsx may be a legitimate composition, so they do not match.
 */
export function noDuplicateComponents(
  filePaths: readonly string[],
  config: SnaplineConfig,
  registry: ComponentRegistry,
): Violation[] {
  const out: Violation[] = []
  for (const filePath of filePaths) {
    if (registry.uiDir !== undefined && filePath.startsWith(registry.uiDir + "/")) continue
    const base = path.basename(filePath)
    const prefixMatch = DUPLICATE_NAME_RE.exec(base)
    const suffixMatch = prefixMatch === null ? SUFFIX_NAME_RE.exec(base) : null
    const kind = prefixMatch?.[2] ?? suffixMatch?.[1]
    if (kind === undefined) continue
    const registryName = KIND_TO_REGISTRY[kind]
    if (registryName === undefined) continue
    const component = registryComponent(registry, registryName)
    if (component === undefined) continue
    const draft: RuleViolationDraft = {
      ruleId: "no-duplicate-components",
      message: `${base} duplicates the design-system ${registryName} component`,
      evidence: base,
      line: 1,
      column: 1,
      instruction: `Use ${registryName} from "${component.importPath}" instead of maintaining ${base}. Fold any needed behavior into call sites or extend the system component.`,
      safeFix: false,
    }
    out.push(...finalizeViolations([draft], { filePath, config }))
  }
  return out
}

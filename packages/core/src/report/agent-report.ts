import type { RepairContract, Violation } from "@usesnapline/contracts"

function shortLabel(violation: Violation): string {
  switch (violation.ruleId) {
    case "no-raw-hex":
      return `raw hex color: ${violation.evidence}`
    case "no-inline-style":
      return `inline style object: ${violation.evidence}`
    case "no-arbitrary-tailwind":
      return `arbitrary value: ${violation.evidence}`
    case "no-raw-palette-color":
      return `raw Tailwind color: ${violation.evidence}`
    case "require-button-component":
      return "raw <button> used while <Button> exists"
    case "require-input-component":
      return "raw <input> used while <Input> exists"
    case "require-dialog-component":
      return "hand-rolled dialog while <Dialog> exists"
    case "require-card-component":
      return "custom card container while <Card> exists"
    case "no-duplicate-components":
      return `duplicate component file: ${violation.evidence}`
  }
}

function dedupePreservingOrder(items: readonly string[]): string[] {
  return [...new Set(items)]
}

/** Format the agent-readable message for one file's violations. */
export function formatAgentMessage(
  filePath: string,
  violations: readonly Violation[],
  requiredActions: readonly string[],
  optionalActions: readonly string[],
): string {
  const lines: string[] = ["SNAPLINE FOUND UI DRIFT", "", filePath, ""]
  lines.push(`${violations.length} violation${violations.length === 1 ? "" : "s"}:`)
  for (const violation of violations) {
    const where = violation.location !== undefined ? ` (line ${violation.location.line})` : ""
    lines.push(`- [${violation.severity}] ${shortLabel(violation)}${where}`)
  }
  if (requiredActions.length > 0) {
    lines.push("", "Repair:")
    for (const action of requiredActions) lines.push(`- ${action}`)
  }
  if (optionalActions.length > 0) {
    lines.push("", "Recommended:")
    for (const action of optionalActions) lines.push(`- ${action}`)
  }
  return lines.join("\n")
}

/** Group violations by file into repair contracts. Deterministic ordering. */
export function buildRepairContracts(violations: readonly Violation[]): RepairContract[] {
  const byFile = new Map<string, Violation[]>()
  for (const violation of violations) {
    const list = byFile.get(violation.filePath) ?? []
    list.push(violation)
    byFile.set(violation.filePath, list)
  }
  const contracts: RepairContract[] = []
  for (const filePath of [...byFile.keys()].sort()) {
    const fileViolations = byFile.get(filePath) ?? []
    const requiredActions = dedupePreservingOrder(
      fileViolations.filter((v) => v.severity === "error").map((v) => v.repair.instruction),
    )
    const optionalActions = dedupePreservingOrder(
      fileViolations.filter((v) => v.severity === "warn").map((v) => v.repair.instruction),
    )
    contracts.push({
      title: `Repair UI drift in ${filePath}`,
      filePath,
      violations: fileViolations,
      requiredActions,
      optionalActions,
      safeFixAvailable: fileViolations.some((v) => v.repair.safeFix),
      agentMessage: formatAgentMessage(filePath, fileViolations, requiredActions, optionalActions),
    })
  }
  return contracts
}

/** One combined message for multiple contracts (used by hook block decisions). */
export function combineAgentMessages(contracts: readonly RepairContract[]): string {
  return contracts.map((c) => c.agentMessage).join("\n\n---\n\n")
}

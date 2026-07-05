import type { ScanResult, Violation } from "@usesnapline/contracts"

function formatViolation(violation: Violation): string {
  const location =
    violation.location !== undefined
      ? `:${violation.location.line}:${violation.location.column}`
      : ""
  return [
    `  ${violation.severity === "error" ? "✖" : "⚠"} ${violation.filePath}${location}`,
    `    ${violation.message} [${violation.ruleId}]`,
    `    fix: ${violation.repair.instruction}`,
  ].join("\n")
}

/** Terminal-friendly scan report. Plain text, no color codes. */
export function humanReport(result: ScanResult): string {
  const lines: string[] = []
  const { score } = result
  if (result.violations.length === 0) {
    lines.push(
      `✔ On-system. Scanned ${result.scannedFiles.length} file(s) in ${result.durationMs}ms.`,
    )
    return lines.join("\n")
  }
  const byFile = new Map<string, Violation[]>()
  for (const violation of result.violations) {
    const list = byFile.get(violation.filePath) ?? []
    list.push(violation)
    byFile.set(violation.filePath, list)
  }
  for (const filePath of [...byFile.keys()].sort()) {
    lines.push(filePath)
    for (const violation of byFile.get(filePath) ?? []) lines.push(formatViolation(violation))
    lines.push("")
  }
  lines.push(
    `${score.errorViolations} error(s), ${score.warningViolations} warning(s) in ${result.scannedFiles.length} file(s) — drift score ${score.driftScore}, component reuse ${(score.componentReuseRate * 100).toFixed(1)}%`,
  )
  if (result.violations.some((v) => v.repair.safeFix)) {
    lines.push(`Run "snapline fix --safe" to apply mechanical fixes.`)
  }
  return lines.join("\n")
}

/** Compact score summary for `snapline score`. */
export function scoreReport(result: ScanResult): string {
  const s = result.score
  return [
    `drift score          ${s.driftScore}`,
    `violations           ${s.totalViolations} (${s.errorViolations} errors, ${s.warningViolations} warnings)`,
    `raw hex values       ${s.rawHexValues}`,
    `inline styles        ${s.inlineStyleObjects}`,
    `arbitrary values     ${s.arbitraryTailwindValues}`,
    `raw palette classes  ${s.rawPaletteClasses}`,
    `raw primitives       ${s.rawPrimitiveCount}`,
    `duplicate components ${s.duplicateComponentCount}`,
    `component reuse      ${(s.componentReuseRate * 100).toFixed(1)}%`,
    `files scanned        ${result.scannedFiles.length}`,
  ].join("\n")
}

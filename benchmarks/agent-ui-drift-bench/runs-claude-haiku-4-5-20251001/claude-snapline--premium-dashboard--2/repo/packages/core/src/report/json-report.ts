import type { ScanResult } from "@usesnapline/contracts"

/**
 * Machine-readable scan output. The shape is the ScanResult contract itself —
 * stable, versioned through @usesnapline/contracts.
 */
export function jsonReport(result: ScanResult): string {
  return JSON.stringify(result, null, 2)
}

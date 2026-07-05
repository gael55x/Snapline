import type { HookDecision, HookEvent, ScanResult } from "@usesnapline/contracts"
import { combineAgentMessages } from "../report/agent-report.js"

/**
 * Agent-agnostic hook policy:
 * - errors  -> block with the repair contract
 * - warns   -> allow, surface the contract as context
 * - clean   -> allow silently
 * A stop event that already retried once never blocks again (loop guard) —
 * the contract is surfaced as context instead.
 */
export function decideFromScan(event: HookEvent, result: ScanResult): HookDecision {
  const { errorViolations, warningViolations } = result.score
  if (errorViolations === 0 && warningViolations === 0) {
    return { action: "allow", contracts: [] }
  }
  const agentMessage = combineAgentMessages(result.contracts)
  if (errorViolations > 0 && !(event.kind === "stop" && event.stopAlreadyRetried === true)) {
    return { action: "block", agentMessage, contracts: result.contracts }
  }
  return { action: "warn", agentMessage, contracts: result.contracts }
}

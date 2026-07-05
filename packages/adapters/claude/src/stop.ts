import type { HookEvent } from "@usesnapline/contracts"

/** Claude Code Stop stdin payload (subset Snapline reads). */
export interface ClaudeStopPayload {
  readonly hook_event_name?: string
  readonly cwd?: string
  readonly stop_hook_active?: boolean
}

/**
 * Normalize a Stop payload. filePaths stays empty — the hook runner falls back
 * to the git-changed set. stop_hook_active guards against blocking loops.
 * Malformed/empty payloads return undefined so the hook allows silently — a
 * broken payload must never block a session.
 */
export function parseStop(payload: unknown, fallbackCwd: string): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as ClaudeStopPayload
  return {
    agent: "claude",
    kind: "stop",
    cwd: typeof p.cwd === "string" ? p.cwd : fallbackCwd,
    filePaths: [],
    stopAlreadyRetried: p.stop_hook_active === true,
  }
}

/**
 * Claude Stop stdout contract:
 * - block: {"decision":"block","reason":...} — Claude cannot finish; the reason
 *   tells it exactly what to repair.
 * - warn:  hookSpecificOutput.additionalContext — feedback without blocking.
 * - allow: no output.
 */
export function formatStopResponse(
  action: "allow" | "warn" | "block",
  agentMessage?: string,
): string | undefined {
  if (action === "allow") return undefined
  if (action === "block") {
    const reason = `${agentMessage ?? ""}\n\nFix the required actions above, then finish. Run "snapline scan --changed" to verify.`
    return JSON.stringify({ decision: "block", reason })
  }
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "Stop",
      additionalContext: agentMessage ?? "",
    },
  })
}

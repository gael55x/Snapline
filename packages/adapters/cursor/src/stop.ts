import type { HookEvent } from "@usesnapline/contracts"

interface CursorStopPayload {
  readonly cwd?: string
  readonly loop_count?: number
}

export function parseCursorStop(payload: unknown, fallbackCwd: string): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as CursorStopPayload
  return {
    agent: "cursor",
    kind: "stop",
    cwd: fallbackCwd,
    filePaths: [],
    stopAlreadyRetried: typeof p.loop_count === "number" && p.loop_count > 0,
  }
}

export function formatCursorStopResponse(
  action: "allow" | "warn" | "block",
  agentMessage?: string,
): string | undefined {
  if (action !== "block") return undefined
  return JSON.stringify({
    followup_message: `${agentMessage ?? ""}\n\nFix the required actions above, then run "snapline scan --changed".`,
  })
}

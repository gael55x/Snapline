import type { HookEvent } from "@usesnapline/contracts"
import type { CodexEventPayload } from "./post-tool-use.js"

export function parseCodexStop(payload: unknown, fallbackCwd: string): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as CodexEventPayload
  if (p.hook_event_name !== undefined && p.hook_event_name !== "Stop") return undefined
  return {
    agent: "codex",
    kind: "stop",
    cwd: typeof p.cwd === "string" ? p.cwd : fallbackCwd,
    filePaths: Array.isArray(p.files)
      ? p.files.filter((file): file is string => typeof file === "string")
      : [],
    stopAlreadyRetried: p.stop_hook_active === true,
  }
}

export function formatCodexStopResponse(
  action: "allow" | "warn" | "block",
  agentMessage?: string,
): string | undefined {
  if (action === "allow") return undefined
  if (action === "block") {
    return JSON.stringify({
      decision: "block",
      reason: `${agentMessage ?? ""}\n\nFix the required actions above, then run "snapline scan --changed".`,
    })
  }
  return JSON.stringify({ systemMessage: agentMessage ?? "" })
}

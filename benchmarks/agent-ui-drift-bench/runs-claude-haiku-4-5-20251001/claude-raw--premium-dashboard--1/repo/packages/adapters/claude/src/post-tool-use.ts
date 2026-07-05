import type { HookEvent } from "@usesnapline/contracts"

/**
 * Claude Code PostToolUse stdin payload (subset Snapline reads).
 * Reference: https://code.claude.com/docs/en/hooks
 */
export interface ClaudePostToolUsePayload {
  readonly hook_event_name?: string
  readonly cwd?: string
  readonly tool_name?: string
  readonly tool_input?: { readonly file_path?: string }
}

const FILE_EDIT_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"])

/**
 * Normalize a PostToolUse payload. Returns undefined when the event is not a
 * file edit Snapline cares about (the hook then allows silently).
 */
export function parsePostToolUse(payload: unknown, fallbackCwd: string): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as ClaudePostToolUsePayload
  if (p.tool_name === undefined || !FILE_EDIT_TOOLS.has(p.tool_name)) return undefined
  const filePath = p.tool_input?.file_path
  if (typeof filePath !== "string" || filePath.length === 0) return undefined
  const cwd = typeof p.cwd === "string" ? p.cwd : fallbackCwd
  const relative = filePath.startsWith(cwd + "/") ? filePath.slice(cwd.length + 1) : filePath
  return {
    agent: "claude",
    kind: "post-tool-use",
    cwd,
    filePaths: [relative],
    toolName: p.tool_name,
  }
}

/**
 * Claude PostToolUse stdout contract:
 * - block: {"decision":"block","reason":...} — the tool already ran; the reason
 *   is fed back to Claude so it repairs before continuing.
 * - warn:  hookSpecificOutput.additionalContext — non-blocking context.
 * - allow: no output.
 */
export function formatPostToolUseResponse(
  action: "allow" | "warn" | "block",
  agentMessage?: string,
): string | undefined {
  if (action === "allow") return undefined
  if (action === "block") {
    return JSON.stringify({ decision: "block", reason: agentMessage ?? "" })
  }
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: agentMessage ?? "",
    },
  })
}

import fs from "node:fs"
import path from "node:path"
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

function canonicalPath(candidate: string): string {
  const missing: string[] = []
  let existing = candidate
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing)
    if (parent === existing) return candidate
    missing.unshift(path.basename(existing))
    existing = parent
  }
  return path.join(fs.realpathSync.native(existing), ...missing)
}

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
  // The hook process working directory is the trusted project boundary.
  // Payload cwd is agent-controlled input and must not redefine that boundary.
  const cwd = path.resolve(fallbackCwd)
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath)
  const rootForRelative = canonicalPath(cwd)
  const fileForRelative = canonicalPath(absolute)
  const relative = path.relative(rootForRelative, fileForRelative).split(path.sep).join("/")
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

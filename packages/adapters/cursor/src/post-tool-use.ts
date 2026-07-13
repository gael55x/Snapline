import fs from "node:fs"
import path from "node:path"
import type { HookEvent } from "@usesnapline/contracts"

interface CursorPostToolUsePayload {
  readonly cwd?: string
  readonly tool_name?: string
  readonly tool_input?: { readonly file_path?: string }
}

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

export function parseCursorPostToolUse(
  payload: unknown,
  fallbackCwd: string,
): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as CursorPostToolUsePayload
  const file = p.tool_input?.file_path
  if (typeof file !== "string" || file.length === 0) return undefined
  const cwd = path.resolve(fallbackCwd)
  const absolute = path.isAbsolute(file) ? file : path.resolve(cwd, file)
  const rootForRelative = canonicalPath(cwd)
  const fileForRelative = canonicalPath(absolute)
  return {
    agent: "cursor",
    kind: "post-tool-use",
    cwd,
    filePaths: [path.relative(rootForRelative, fileForRelative).split(path.sep).join("/")],
    toolName: p.tool_name,
  }
}

export function formatCursorPostToolUseResponse(
  action: "allow" | "warn" | "block",
  agentMessage?: string,
): string | undefined {
  if (action === "allow") return undefined
  return JSON.stringify({ additional_context: agentMessage ?? "" })
}

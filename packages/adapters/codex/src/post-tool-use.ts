import fs from "node:fs"
import path from "node:path"
import type { HookEvent } from "@usesnapline/contracts"

/** Current Codex PostToolUse fields plus the pre-hook beta neutral shape. */
export interface CodexEventPayload {
  readonly hook_event_name?: string
  readonly cwd?: string
  readonly tool_name?: string
  readonly tool_input?: { readonly command?: string; readonly file_path?: string }
  readonly files?: readonly string[]
  readonly file_path?: string
  readonly stop_hook_active?: boolean
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

function normalizeFile(cwd: string, file: string): string {
  const absolute = path.isAbsolute(file) ? file : path.resolve(cwd, file)
  const rootForRelative = canonicalPath(cwd)
  const fileForRelative = canonicalPath(absolute)
  return path.relative(rootForRelative, fileForRelative).split(path.sep).join("/")
}

function patchFiles(command: string): string[] {
  const files: string[] = []
  for (const line of command.split("\n")) {
    const match = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/.exec(line)
    if (match?.[1] !== undefined) files.push(match[1])
    const move = /^\*\*\* Move to: (.+)$/.exec(line)
    if (move?.[1] !== undefined) files.push(move[1])
  }
  return files
}

/** Normalize the official Codex PostToolUse payload into Snapline's core event. */
export function parseCodexPostToolUse(
  payload: unknown,
  fallbackCwd: string,
): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as CodexEventPayload
  if (p.hook_event_name !== undefined && p.hook_event_name !== "PostToolUse") return undefined
  const cwd = path.resolve(fallbackCwd)
  const files = Array.isArray(p.files)
    ? p.files.filter((file): file is string => typeof file === "string")
    : []
  if (typeof p.file_path === "string") files.push(p.file_path)
  if (typeof p.tool_input?.file_path === "string") files.push(p.tool_input.file_path)
  if (typeof p.tool_input?.command === "string") files.push(...patchFiles(p.tool_input.command))
  const normalized = [...new Set(files.map((file) => normalizeFile(cwd, file)))]
  if (normalized.length === 0) return undefined
  return {
    agent: "codex",
    kind: "post-tool-use",
    cwd,
    filePaths: normalized,
    toolName: p.tool_name,
  }
}

/** Format structured JSON that Codex adds to the model's next step. */
export function formatCodexPostToolUseResponse(
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

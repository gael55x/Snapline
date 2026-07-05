import type { HookEvent } from "@usesnapline/contracts"

/**
 * Codex adapter payload (BETA).
 *
 * Codex does not yet expose a stable lifecycle-hook API equivalent to Claude
 * Code's PostToolUse/Stop. Until it does, Snapline accepts this documented
 * neutral shape on stdin; wire whatever event mechanism your Codex setup has
 * (wrapper script, notify config) to `snapline hook codex post-tool-use`:
 *
 *   { "cwd": "/abs/project", "files": ["src/app/page.tsx"] }
 *
 * Claude payload field names (tool_input.file_path) are also accepted so a
 * future Codex hook API with a similar shape works unchanged.
 */
export interface CodexEventPayload {
  readonly cwd?: string
  readonly files?: readonly string[]
  readonly file_path?: string
  readonly tool_input?: { readonly file_path?: string }
}

export function parseCodexPostToolUse(
  payload: unknown,
  fallbackCwd: string,
): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as CodexEventPayload
  const cwd = typeof p.cwd === "string" ? p.cwd : fallbackCwd
  const files: string[] = []
  if (Array.isArray(p.files))
    files.push(...p.files.filter((f): f is string => typeof f === "string"))
  const single = p.file_path ?? p.tool_input?.file_path
  if (typeof single === "string") files.push(single)
  if (files.length === 0) return undefined
  const relative = files.map((f) => (f.startsWith(cwd + "/") ? f.slice(cwd.length + 1) : f))
  return { agent: "codex", kind: "post-tool-use", cwd, filePaths: relative }
}

/**
 * Codex output contract (beta): a plain-text repair contract on stdout plus a
 * non-zero exit code on block. Exit 2 mirrors Claude semantics so wrapper
 * scripts can treat both agents identically.
 */
export function codexExitCode(action: "allow" | "warn" | "block"): number {
  return action === "block" ? 2 : 0
}

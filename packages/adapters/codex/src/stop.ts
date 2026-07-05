import type { HookEvent } from "@usesnapline/contracts"
import type { CodexEventPayload } from "./post-tool-use.js"

/**
 * Normalize a Codex stop-style event (beta). Empty files -> git-changed
 * fallback. Malformed payloads return undefined (allow) — never block on
 * garbage input.
 */
export function parseCodexStop(payload: unknown, fallbackCwd: string): HookEvent | undefined {
  if (typeof payload !== "object" || payload === null) return undefined
  const p = payload as CodexEventPayload
  return {
    agent: "codex",
    kind: "stop",
    cwd: typeof p.cwd === "string" ? p.cwd : fallbackCwd,
    filePaths: Array.isArray(p.files)
      ? p.files.filter((f): f is string => typeof f === "string")
      : [],
  }
}

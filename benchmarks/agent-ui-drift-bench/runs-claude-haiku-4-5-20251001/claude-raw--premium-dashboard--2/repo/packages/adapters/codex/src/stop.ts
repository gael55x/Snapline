import type { HookEvent } from "@usesnapline/contracts"
import type { CodexEventPayload } from "./post-tool-use.js"

/** Normalize a Codex stop-style event (beta). Empty files -> git-changed fallback. */
export function parseCodexStop(payload: unknown, fallbackCwd: string): HookEvent {
  const p = (typeof payload === "object" && payload !== null ? payload : {}) as CodexEventPayload
  return {
    agent: "codex",
    kind: "stop",
    cwd: typeof p.cwd === "string" ? p.cwd : fallbackCwd,
    filePaths: Array.isArray(p.files)
      ? p.files.filter((f): f is string => typeof f === "string")
      : [],
  }
}

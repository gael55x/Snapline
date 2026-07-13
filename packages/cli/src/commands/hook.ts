import fs from "node:fs"
import process from "node:process"
import type { HookDecision, HookEvent } from "@usesnapline/contracts"
import { runHook } from "@usesnapline/core"
import {
  parsePostToolUse,
  formatPostToolUseResponse,
  parseStop,
  formatStopResponse,
} from "@usesnapline/claude"
import {
  parseCodexPostToolUse,
  formatCodexPostToolUseResponse,
  parseCodexStop,
  formatCodexStopResponse,
} from "@usesnapline/codex"
import {
  parseCursorPostToolUse,
  formatCursorPostToolUseResponse,
  parseCursorStop,
  formatCursorStopResponse,
} from "@usesnapline/cursor"
import type { CliContext } from "../main.js"

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString("utf8")
}

function parseJson(
  text: string,
): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

function malformedPayloadResponse(
  agent: "claude" | "codex" | "cursor",
  kind: "post-tool-use" | "stop",
): string {
  const message =
    'SNAPLINE COULD NOT READ THE HOOK PAYLOAD\n\nExpected valid JSON on stdin. Run "snapline doctor" and inspect the agent hook configuration.'
  if (agent === "claude") {
    return (
      kind === "post-tool-use"
        ? formatPostToolUseResponse("warn", message)
        : formatStopResponse("warn", message)
    )!
  }
  if (agent === "codex") {
    return kind === "post-tool-use"
      ? formatCodexPostToolUseResponse("warn", message)!
      : formatCodexStopResponse("warn", message)!
  }
  return kind === "post-tool-use"
    ? formatCursorPostToolUseResponse("warn", message)!
    : formatCursorStopResponse("warn", message)!
}

/**
 * Benchmark telemetry: when SNAPLINE_HOOK_LOG is set, append one JSON line per
 * hook run so agent-ui-drift-bench can measure repair iterations and hook
 * runtime. No-op (and never fatal) otherwise.
 */
function timedRunHook(event: HookEvent): HookDecision {
  const startedAt = performance.now()
  const decision = runHook(event)
  const logPath = process.env.SNAPLINE_HOOK_LOG
  if (logPath !== undefined && logPath.length > 0) {
    try {
      fs.appendFileSync(
        logPath,
        JSON.stringify({
          agent: event.agent,
          kind: event.kind,
          action: decision.action,
          durationMs: Math.round(performance.now() - startedAt),
          files: event.filePaths,
        }) + "\n",
      )
    } catch {
      // telemetry must never break a hook
    }
  }
  return decision
}

/**
 * `snapline hook <claude|codex|cursor> <post-tool-use|stop>` — reads the agent's hook
 * payload from stdin and answers in that agent's output contract. Never exits
 * non-zero: decisions travel in each agent's structured JSON response.
 */
export async function runHookCommand(ctx: CliContext): Promise<number> {
  const [agent, kind] = ctx.args
  if (
    ctx.args.length !== 2 ||
    (agent !== "claude" && agent !== "codex" && agent !== "cursor") ||
    (kind !== "post-tool-use" && kind !== "stop")
  ) {
    process.stderr.write("Usage: snapline hook <claude|codex|cursor> <post-tool-use|stop>\n")
    return 1
  }
  const parsed = parseJson(await readStdin())
  if (!parsed.ok) {
    process.stdout.write(malformedPayloadResponse(agent, kind) + "\n")
    return 0
  }
  const payload = parsed.value

  if (agent === "claude") {
    const event =
      kind === "post-tool-use" ? parsePostToolUse(payload, ctx.cwd) : parseStop(payload, ctx.cwd)
    if (event === undefined) return 0
    const decision = timedRunHook(event)
    const response =
      kind === "post-tool-use"
        ? formatPostToolUseResponse(decision.action, decision.agentMessage)
        : formatStopResponse(decision.action, decision.agentMessage)
    if (response !== undefined) process.stdout.write(response + "\n")
    return 0
  }

  const event =
    agent === "codex"
      ? kind === "post-tool-use"
        ? parseCodexPostToolUse(payload, ctx.cwd)
        : parseCodexStop(payload, ctx.cwd)
      : kind === "post-tool-use"
        ? parseCursorPostToolUse(payload, ctx.cwd)
        : parseCursorStop(payload, ctx.cwd)
  if (event === undefined) return 0
  const decision = timedRunHook(event)
  const response =
    agent === "codex"
      ? kind === "post-tool-use"
        ? formatCodexPostToolUseResponse(decision.action, decision.agentMessage)
        : formatCodexStopResponse(decision.action, decision.agentMessage)
      : kind === "post-tool-use"
        ? formatCursorPostToolUseResponse(decision.action, decision.agentMessage)
        : formatCursorStopResponse(decision.action, decision.agentMessage)
  if (response !== undefined) process.stdout.write(response + "\n")
  return 0
}

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
import { parseCodexPostToolUse, parseCodexStop, codexExitCode } from "@usesnapline/codex"
import type { CliContext } from "../main.js"

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString("utf8")
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
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
 * `snapline hook <claude|codex> <post-tool-use|stop>` — reads the agent's hook
 * payload from stdin and answers in that agent's output contract. Never exits
 * non-zero for Claude (decisions travel in JSON); Codex uses exit 2 to block.
 */
export async function runHookCommand(ctx: CliContext): Promise<number> {
  const [agent, kind] = ctx.args
  if ((agent !== "claude" && agent !== "codex") || (kind !== "post-tool-use" && kind !== "stop")) {
    process.stderr.write("Usage: snapline hook <claude|codex> <post-tool-use|stop>\n")
    return 1
  }
  const payload = parseJson(await readStdin())

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
    kind === "post-tool-use"
      ? parseCodexPostToolUse(payload, ctx.cwd)
      : parseCodexStop(payload, ctx.cwd)
  if (event === undefined) return 0
  const decision = timedRunHook(event)
  if (decision.agentMessage !== undefined) process.stdout.write(decision.agentMessage + "\n")
  return codexExitCode(decision.action)
}

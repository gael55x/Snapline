import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { runHook } from "@usesnapline/core"
import {
  parsePostToolUse,
  formatPostToolUseResponse,
  parseStop,
  formatStopResponse,
  installClaudeHooks,
  uninstallClaudeHooks,
  claudeHooksInstalled,
} from "../src/index.js"

/** Captured from a real Claude Code session shape (docs: code.claude.com/docs/en/hooks). */
const POST_TOOL_USE_PAYLOAD = {
  session_id: "abc123",
  transcript_path: "/tmp/transcript.jsonl",
  cwd: "/replaced/below",
  hook_event_name: "PostToolUse",
  tool_name: "Write",
  tool_input: { file_path: "/replaced/below/src/app/page.tsx", content: "..." },
  tool_response: { filePath: "/replaced/below/src/app/page.tsx", success: true },
}

const STOP_PAYLOAD = {
  session_id: "abc123",
  transcript_path: "/tmp/transcript.jsonl",
  cwd: "/replaced/below",
  hook_event_name: "Stop",
  stop_hook_active: false,
}

let tmp: string

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-claude-"))
  fs.mkdirSync(path.join(tmp, "src", "app"), { recursive: true })
  fs.mkdirSync(path.join(tmp, "src", "components", "ui"), { recursive: true })
  fs.writeFileSync(
    path.join(tmp, "src", "components", "ui", "button.tsx"),
    "export const Button = () => null\n",
  )
  fs.writeFileSync(
    path.join(tmp, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
  )
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

function payloadFor(file: string): unknown {
  return {
    ...POST_TOOL_USE_PAYLOAD,
    cwd: tmp,
    tool_input: { file_path: path.join(tmp, file) },
  }
}

describe("Claude PostToolUse", () => {
  it("normalizes Write payloads to a relative-path HookEvent", () => {
    const event = parsePostToolUse(payloadFor("src/app/page.tsx"), "/fallback")
    expect(event).toMatchObject({
      agent: "claude",
      kind: "post-tool-use",
      cwd: tmp,
      filePaths: ["src/app/page.tsx"],
      toolName: "Write",
    })
  })

  it("ignores non-edit tools and missing file paths", () => {
    expect(parsePostToolUse({ ...POST_TOOL_USE_PAYLOAD, tool_name: "Bash" }, "/x")).toBeUndefined()
    expect(parsePostToolUse({ ...POST_TOOL_USE_PAYLOAD, tool_input: {} }, "/x")).toBeUndefined()
  })

  it("blocks with a repair contract when the edited file has errors", () => {
    fs.writeFileSync(
      path.join(tmp, "src", "app", "page.tsx"),
      `export default function P() { return <button className="bg-blue-500 mt-[13px]">Go</button> }`,
    )
    const event = parsePostToolUse(payloadFor("src/app/page.tsx"), tmp)
    const decision = runHook(event!)
    expect(decision.action).toBe("block")
    const response = formatPostToolUseResponse(decision.action, decision.agentMessage)
    const parsed = JSON.parse(response!) as { decision: string; reason: string }
    expect(parsed.decision).toBe("block")
    expect(parsed.reason).toContain("SNAPLINE FOUND UI DRIFT")
    expect(parsed.reason).toContain("mt-[13px]")
  })

  it("stays silent for clean files", () => {
    fs.writeFileSync(
      path.join(tmp, "src", "app", "page.tsx"),
      `export default function P() { return <p className="text-muted-foreground">ok</p> }`,
    )
    const event = parsePostToolUse(payloadFor("src/app/page.tsx"), tmp)
    const decision = runHook(event!)
    expect(decision.action).toBe("allow")
    expect(formatPostToolUseResponse(decision.action, decision.agentMessage)).toBeUndefined()
  })

  it("warns without blocking for warning-only drift", () => {
    fs.writeFileSync(
      path.join(tmp, "src", "app", "page.tsx"),
      `export default function P() { return <p className="text-gray-500">ok</p> }`,
    )
    const event = parsePostToolUse(payloadFor("src/app/page.tsx"), tmp)
    const decision = runHook(event!)
    expect(decision.action).toBe("warn")
    const parsed = JSON.parse(
      formatPostToolUseResponse(decision.action, decision.agentMessage)!,
    ) as {
      hookSpecificOutput: { hookEventName: string; additionalContext: string }
    }
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PostToolUse")
    expect(parsed.hookSpecificOutput.additionalContext).toContain("text-gray-500")
  })
})

describe("Claude Stop", () => {
  it("returns undefined for malformed payloads — garbage stdin must never block", () => {
    expect(parseStop(undefined, "/x")).toBeUndefined()
    expect(parseStop("not json", "/x")).toBeUndefined()
    expect(parseStop(42, "/x")).toBeUndefined()
  })

  it("normalizes payloads and honors stop_hook_active as the loop guard", () => {
    const first = parseStop({ ...STOP_PAYLOAD, cwd: tmp }, "/x")
    expect(first).toMatchObject({ kind: "stop", stopAlreadyRetried: false })
    const retried = parseStop({ ...STOP_PAYLOAD, cwd: tmp, stop_hook_active: true }, "/x")
    expect(retried?.stopAlreadyRetried).toBe(true)
  })

  it("formats a blocking decision with next-step guidance", () => {
    const response = formatStopResponse("block", "SNAPLINE FOUND UI DRIFT\n...")
    const parsed = JSON.parse(response!) as { decision: string; reason: string }
    expect(parsed.decision).toBe("block")
    expect(parsed.reason).toContain("snapline scan --changed")
  })

  it("blocks on a real git-changed file and downgrades the retry to context", () => {
    const file = path.join(tmp, "src", "app", "page.tsx")
    fs.writeFileSync(file, "export default () => <main />\n")
    execFileSync("git", ["init"], { cwd: tmp, stdio: "ignore" })
    execFileSync("git", ["add", "."], { cwd: tmp, stdio: "ignore" })
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Snapline Test",
        "-c",
        "user.email=test@snapline.dev",
        "commit",
        "-m",
        "fixture",
      ],
      { cwd: tmp, stdio: "ignore" },
    )
    fs.writeFileSync(file, 'export default () => <main style={{ color: "#fff" }} />\n')

    const first = runHook(parseStop({ ...STOP_PAYLOAD, cwd: tmp }, tmp)!)
    expect(first.action).toBe("block")
    expect(first.agentMessage).toContain("SNAPLINE FOUND UI DRIFT")

    const retry = runHook(parseStop({ ...STOP_PAYLOAD, cwd: tmp, stop_hook_active: true }, tmp)!)
    expect(retry.action).toBe("warn")
    expect(JSON.parse(formatStopResponse(retry.action, retry.agentMessage)!)).toMatchObject({
      hookSpecificOutput: { hookEventName: "Stop" },
    })
  })
})

describe("installClaudeHooks", () => {
  it("writes hooks into .claude/settings.json, preserves others, and is idempotent", () => {
    const settingsPath = path.join(tmp, ".claude", "settings.json")
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        permissions: { allow: ["Bash(ls:*)"] },
        hooks: {
          PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "other-tool" }] }],
        },
      }),
    )
    const first = installClaudeHooks(tmp)
    expect(first.changed).toBe(true)
    expect(claudeHooksInstalled(tmp)).toBe(true)

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as {
      permissions: unknown
      hooks: { PostToolUse: unknown[]; Stop: unknown[] }
    }
    expect(settings.permissions).toEqual({ allow: ["Bash(ls:*)"] })
    expect(settings.hooks.PostToolUse).toHaveLength(2)
    expect(JSON.stringify(settings.hooks.Stop)).toContain("snapline hook claude stop")

    const second = installClaudeHooks(tmp)
    expect(second.changed).toBe(false)
    expect(
      (JSON.parse(fs.readFileSync(settingsPath, "utf8")) as { hooks: { PostToolUse: unknown[] } })
        .hooks.PostToolUse,
    ).toHaveLength(2)

    expect(uninstallClaudeHooks(tmp).changed).toBe(true)
    const uninstalled = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as {
      permissions: unknown
      hooks: { PostToolUse: unknown[]; Stop?: unknown[] }
    }
    expect(uninstalled.permissions).toEqual({ allow: ["Bash(ls:*)"] })
    expect(uninstalled.hooks.PostToolUse).toHaveLength(1)
    expect(uninstalled.hooks.Stop).toBeUndefined()
    expect(claudeHooksInstalled(tmp)).toBe(false)
  })

  it("uses npx --no-install for project-local installs (hook shells lack node_modules/.bin on PATH)", () => {
    const binDir = path.join(tmp, "node_modules", ".bin")
    fs.mkdirSync(binDir, { recursive: true })
    fs.writeFileSync(path.join(binDir, "snapline"), "#!/bin/sh\n")
    installClaudeHooks(tmp)
    const settings = fs.readFileSync(path.join(tmp, ".claude", "settings.json"), "utf8")
    expect(settings).toContain("npx --no-install snapline hook claude post-tool-use")
    expect(settings).toContain("npx --no-install snapline hook claude stop")
    expect(claudeHooksInstalled(tmp)).toBe(true)
  })
})

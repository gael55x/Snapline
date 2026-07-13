import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  formatCursorPostToolUseResponse,
  formatCursorStopResponse,
  installCursor,
  uninstallCursor,
  cursorHooksInstalled,
  parseCursorPostToolUse,
  parseCursorStop,
} from "../src/index.js"

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe("Cursor hooks", () => {
  it("installs project hooks and the agent rule idempotently", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-cursor-"))
    roots.push(root)
    expect(installCursor(root).changed).toBe(true)
    expect(installCursor(root).changed).toBe(false)
    const document = JSON.parse(
      fs.readFileSync(path.join(root, ".cursor", "hooks.json"), "utf8"),
    ) as {
      version: number
      hooks: Record<string, unknown[]>
    }
    expect(document.version).toBe(1)
    expect(Object.keys(document.hooks).sort()).toEqual(["postToolUse", "stop"])
    expect(cursorHooksInstalled(root)).toBe(true)
    expect(uninstallCursor(root).changed).toBe(true)
    expect(cursorHooksInstalled(root)).toBe(false)
    expect(fs.existsSync(path.join(root, ".cursor", "rules", "snapline.mdc"))).toBe(false)
  })

  it("normalizes PostToolUse and injects the repair contract as context", () => {
    const event = parseCursorPostToolUse(
      { cwd: "/repo", tool_name: "Write", tool_input: { file_path: "/repo/src/app/page.tsx" } },
      "/fallback",
    )
    expect(event?.filePaths).toEqual(["src/app/page.tsx"])
    expect(JSON.parse(formatCursorPostToolUseResponse("block", "repair") ?? "")).toEqual({
      additional_context: "repair",
    })
  })

  it("uses loop_count as the Stop retry guard", () => {
    expect(parseCursorStop({ loop_count: 1 }, "/repo")?.stopAlreadyRetried).toBe(true)
    expect(
      JSON.parse(formatCursorStopResponse("block", "repair") ?? "").followup_message,
    ).toContain("repair")
    expect(formatCursorStopResponse("warn", "warning")).toBeUndefined()
  })
})

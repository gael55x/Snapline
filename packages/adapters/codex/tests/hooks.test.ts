import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  formatCodexPostToolUseResponse,
  formatCodexStopResponse,
  installCodex,
  uninstallCodex,
  codexHooksInstalled,
  parseCodexPostToolUse,
  parseCodexStop,
} from "../src/index.js"

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe("Codex hooks", () => {
  it("installs official project hooks without replacing existing hooks", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-codex-"))
    roots.push(root)
    fs.mkdirSync(path.join(root, ".codex"))
    fs.writeFileSync(
      path.join(root, ".codex", "hooks.json"),
      JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "existing" }] }] } }),
    )

    expect(installCodex(root).changed).toBe(true)
    expect(installCodex(root).changed).toBe(false)
    const document = JSON.parse(
      fs.readFileSync(path.join(root, ".codex", "hooks.json"), "utf8"),
    ) as {
      hooks: Record<string, unknown[]>
    }
    expect(document.hooks.PostToolUse).toHaveLength(1)
    expect(document.hooks.Stop).toHaveLength(2)
    expect(codexHooksInstalled(root)).toBe(true)
    expect(uninstallCodex(root).changed).toBe(true)
    const uninstalled = JSON.parse(
      fs.readFileSync(path.join(root, ".codex", "hooks.json"), "utf8"),
    ) as { hooks: Record<string, unknown[]> }
    expect(uninstalled.hooks.PostToolUse).toBeUndefined()
    expect(uninstalled.hooks.Stop).toHaveLength(1)
    expect(codexHooksInstalled(root)).toBe(false)
  })

  it("extracts changed files from the official apply_patch payload", () => {
    const event = parseCodexPostToolUse(
      {
        hook_event_name: "PostToolUse",
        cwd: "/repo",
        tool_name: "apply_patch",
        tool_input: {
          command:
            "*** Begin Patch\n*** Update File: src/app/page.tsx\n*** Add File: src/app/card.tsx\n*** End Patch",
        },
      },
      "/fallback",
    )
    expect(event?.filePaths).toEqual(["src/app/page.tsx", "src/app/card.tsx"])
    expect(event?.cwd).toBe("/fallback")
  })

  it("formats model-visible PostToolUse and loop-guarded Stop responses", () => {
    expect(JSON.parse(formatCodexPostToolUseResponse("block", "repair") ?? "")).toEqual({
      decision: "block",
      reason: "repair",
    })
    expect(
      parseCodexStop({ hook_event_name: "Stop", cwd: "/outside", stop_hook_active: true }, "/repo"),
    ).toMatchObject({
      kind: "stop",
      cwd: "/repo",
      stopAlreadyRetried: true,
    })
    expect(JSON.parse(formatCodexStopResponse("block", "repair") ?? "").decision).toBe("block")
  })
})

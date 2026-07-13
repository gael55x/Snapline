import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { afterEach, describe, expect, it } from "vitest"

const temporaryProjects: string[] = []
const here = path.dirname(fileURLToPath(import.meta.url))
const script = path.resolve(here, "../scripts/post-tool-use.js")

afterEach(() => {
  for (const project of temporaryProjects.splice(0)) {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

describe("Claude plugin launcher", () => {
  it("returns visible agent context when the CLI is missing", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-plugin-missing-cli-"))
    temporaryProjects.push(root)
    const result = spawnSync(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, PATH: "" },
      input: JSON.stringify({
        hook_event_name: "PostToolUse",
        cwd: "/untrusted/payload/root",
        tool_name: "Write",
        tool_input: { file_path: "src/page.tsx" },
      }),
      encoding: "utf8",
    })

    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: expect.stringContaining("Snapline CLI not found"),
      },
    })
    expect(result.stderr).toContain("hook allowed")
  })
})

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { runHook } from "../../src/hook/run-hook.js"

const temporaryProjects: string[] = []

afterEach(() => {
  for (const project of temporaryProjects.splice(0)) {
    fs.rmSync(project, { recursive: true, force: true })
  }
})

describe("runHook", () => {
  it("surfaces scanner failures instead of silently allowing completion", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-hook-error-"))
    temporaryProjects.push(root)
    fs.mkdirSync(path.join(root, "src"), { recursive: true })
    fs.writeFileSync(path.join(root, "src", "page.tsx"), "export default () => <main />\n")
    fs.writeFileSync(path.join(root, "snapline.yml"), "version: 2\n")

    const decision = runHook({
      agent: "claude",
      kind: "post-tool-use",
      cwd: root,
      filePaths: ["src/page.tsx"],
    })

    expect(decision.action).toBe("warn")
    expect(decision.agentMessage).toContain("SNAPLINE COULD NOT ANALYZE UI")
    expect(decision.agentMessage).toContain("Unsupported config version: 2")
  })
})

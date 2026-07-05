import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(here, "..", "..", "..")
const tsxBin = path.join(repoRoot, "node_modules", ".bin", "tsx")
const cliMain = path.join(here, "..", "src", "main.ts")
const basicFixture = path.join(repoRoot, "fixtures", "next-shadcn-basic")

interface CliRun {
  stdout: string
  status: number
}

function cli(args: string[], cwd: string, stdin?: string): CliRun {
  try {
    const stdout = execFileSync(tsxBin, [cliMain, ...args], {
      cwd,
      encoding: "utf8",
      input: stdin,
      env: { ...process.env, NODE_OPTIONS: "" },
    })
    return { stdout, status: 0 }
  } catch (error) {
    const e = error as { stdout?: string; status?: number }
    return { stdout: e.stdout ?? "", status: e.status ?? 1 }
  }
}

let dirtyProject: string

beforeAll(() => {
  dirtyProject = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-cli-"))
  fs.cpSync(basicFixture, dirtyProject, { recursive: true })
  fs.writeFileSync(
    path.join(dirtyProject, "src", "app", "dirty.tsx"),
    `export default function Dirty() {
  return (
    <div style={{ marginTop: "13px" }}>
      <button className="bg-blue-500 text-white mt-[13px]">Go</button>
    </div>
  )
}
`,
  )
})

afterAll(() => {
  fs.rmSync(dirtyProject, { recursive: true, force: true })
})

describe("snapline scan", () => {
  it("passes on the clean fixture", () => {
    const run = cli(["scan"], basicFixture)
    expect(run.status).toBe(0)
    expect(run.stdout).toContain("On-system")
  })

  it("fails with readable violations on a dirty project", () => {
    const run = cli(["scan"], dirtyProject)
    expect(run.status).toBe(1)
    expect(run.stdout).toContain("src/app/dirty.tsx")
    expect(run.stdout).toContain("no-inline-style")
    expect(run.stdout).toContain("require-button-component")
  })

  it("emits the ScanResult contract with --json", () => {
    const run = cli(["scan", "--json"], dirtyProject)
    const parsed = JSON.parse(run.stdout) as {
      violations: unknown[]
      score: { driftScore: number }
      contracts: { agentMessage: string }[]
    }
    expect(parsed.violations.length).toBeGreaterThan(0)
    expect(parsed.score.driftScore).toBeGreaterThan(0)
    expect(parsed.contracts[0]?.agentMessage).toContain("SNAPLINE FOUND UI DRIFT")
  })
})

describe("snapline score", () => {
  it("prints the score summary and exits 0 even with drift", () => {
    const run = cli(["score"], dirtyProject)
    expect(run.status).toBe(0)
    expect(run.stdout).toContain("drift score")
    expect(run.stdout).toContain("component reuse")
  })
})

describe("snapline fix --safe", () => {
  it("applies only mechanical fixes", () => {
    const project = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-fix-"))
    fs.cpSync(basicFixture, project, { recursive: true })
    const target = path.join(project, "src", "app", "fixme.tsx")
    fs.writeFileSync(
      target,
      `export default function F() {
  return <div className="text-gray-500" style={{ marginTop: "12px" }}>x</div>
}
`,
    )
    const run = cli(["fix", "--safe"], project)
    expect(run.status).toBe(0)
    const fixed = fs.readFileSync(target, "utf8")
    expect(fixed).toContain("text-muted-foreground")
    expect(fixed).toContain("mt-3")
    expect(fixed).not.toContain("style=")
    fs.rmSync(project, { recursive: true, force: true })
  })

  it("refuses to run without --safe", () => {
    const run = cli(["fix"], dirtyProject)
    expect(run.status).toBe(1)
  })
})

describe("snapline hook claude", () => {
  it("post-tool-use blocks with a repair contract on a dirty edit", () => {
    const payload = JSON.stringify({
      hook_event_name: "PostToolUse",
      cwd: dirtyProject,
      tool_name: "Write",
      tool_input: { file_path: path.join(dirtyProject, "src", "app", "dirty.tsx") },
    })
    const run = cli(["hook", "claude", "post-tool-use"], dirtyProject, payload)
    expect(run.status).toBe(0)
    const parsed = JSON.parse(run.stdout) as { decision: string; reason: string }
    expect(parsed.decision).toBe("block")
    expect(parsed.reason).toContain("SNAPLINE FOUND UI DRIFT")
  })

  it("post-tool-use is silent for irrelevant tools", () => {
    const payload = JSON.stringify({
      hook_event_name: "PostToolUse",
      cwd: dirtyProject,
      tool_name: "Bash",
      tool_input: { command: "ls" },
    })
    const run = cli(["hook", "claude", "post-tool-use"], dirtyProject, payload)
    expect(run.status).toBe(0)
    expect(run.stdout.trim()).toBe("")
  })
})

describe("snapline init + doctor", () => {
  it("writes config and state, then doctor reports component resolution", () => {
    const project = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-init-"))
    fs.cpSync(basicFixture, project, { recursive: true })
    fs.rmSync(path.join(project, "snapline.yml"), { force: true })
    const init = cli(["init"], project)
    expect(init.status).toBe(0)
    expect(fs.existsSync(path.join(project, "snapline.yml"))).toBe(true)
    expect(fs.existsSync(path.join(project, ".snapline", ".gitignore"))).toBe(true)

    const doctor = cli(["doctor"], project)
    expect(doctor.stdout).toContain("component Button resolves")
    expect(doctor.stdout).toContain("snapline.yml valid")
    fs.rmSync(project, { recursive: true, force: true })
  })
})

describe("snapline install claude", () => {
  it("creates .claude/settings.json with both hooks", () => {
    const project = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-install-"))
    fs.cpSync(basicFixture, project, { recursive: true })
    const run = cli(["install", "claude"], project)
    expect(run.status).toBe(0)
    const settings = JSON.parse(
      fs.readFileSync(path.join(project, ".claude", "settings.json"), "utf8"),
    ) as { hooks: Record<string, unknown> }
    expect(Object.keys(settings.hooks).sort()).toEqual(["PostToolUse", "Stop"])
    fs.rmSync(project, { recursive: true, force: true })
  })
})

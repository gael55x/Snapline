/**
 * Live agent benchmark runner.
 *
 * Protocol per run (mode × prompt × attempt):
 *   1. Fresh checkout: local `git clone` of this repository into runs/<runId>/repo
 *   2. `pnpm install` in the clone (frozen lockfile), cd into the prompt's fixture
 *   3. mode.prepare() — tooling setup, committed so the agent diff stays clean
 *   4. Run the agent CLI with the prompt (no manual cleanup, no cherry-picking)
 *   5. Score with the Snapline scanner, typecheck, collect git diff and raw logs
 *   6. Write BenchmarkRun JSON; failures are recorded with reasons, never dropped
 *
 * Requires the `claude` CLI and API access. CI runs the static harness instead
 * (run-static.ts); this runner is for maintainers producing the public report.
 *
 * Usage:
 *   pnpm bench:agent -- --mode claude-raw --prompt login-page [--attempt 1] [--dry-run]
 *   pnpm bench:agent -- --all [--dry-run]           # full matrix from benchmark.config.json
 */
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import process from "node:process"
import type { BenchmarkMode, BenchmarkRun } from "@usesnapline/contracts"
import type { BenchMode } from "../modes/types.js"
import { loadBenchConfig, loadPrompt, listPromptIds, benchRoot, repoRoot } from "./config.js"
import { resolveMode } from "./run-mode.js"
import { scoreOutput, typecheckPass, filesTouched } from "./score-output.js"

interface RunSpec {
  readonly mode: string
  readonly promptId: string
  readonly attempt: number
  /** Overrides benchmark.config.json model; runs land in runs-<model>/ to keep reports segregated. */
  readonly model?: string
}

function dirSegment(value: string): string {
  return value.replace(/[^a-z0-9.-]/gi, "-")
}

function runsDirFor(agent: BenchMode["agent"], model: string | undefined): string {
  const parts = [agent === "claude" ? undefined : agent, model?.trim() || undefined]
  const suffix = parts
    .filter((part): part is string => part !== undefined)
    .map(dirSegment)
    .join("-")
  return suffix.length === 0 ? "runs" : `runs-${suffix}`
}

function codexDefaultModel(): string {
  const codeHome = process.env.CODEX_HOME ?? path.join(homedir(), ".codex")
  const configPath = path.join(codeHome, "config.toml")
  const config = fs.readFileSync(configPath, "utf8")
  const match = /^\s*model\s*=\s*["']([^"']+)["']\s*$/m.exec(config)
  if (match === null) throw new Error(`Codex model not found in ${configPath}`)
  return match[1]!
}

function modelFor(mode: BenchMode, override: string | undefined, configModel: string): string {
  if (override !== undefined) return override
  return mode.agent === "codex" ? codexDefaultModel() : configModel
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
}

function commandVersion(command: string): string | undefined {
  try {
    return execFileSync(command, ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
    })
      .trim()
      .split("\n")[0]
  } catch {
    return undefined
  }
}

function toolVersions(fixtureDir: string): Record<string, string> {
  const versions: Record<string, string> = {}
  for (const name of ["@buoy-design/cli", "driftguard", "eslint", "eslint-plugin-tailwindcss"]) {
    const packagePath = path.join(fixtureDir, "node_modules", name, "package.json")
    if (!fs.existsSync(packagePath)) continue
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version?: string }
    if (pkg.version !== undefined) versions[name] = pkg.version
  }
  const mcpPath = path.join(fixtureDir, ".mcp.json")
  if (fs.existsSync(mcpPath)) {
    const text = fs.readFileSync(mcpPath, "utf8")
    const version = /shadcn@(\d+\.\d+\.\d+)/.exec(text)?.[1]
    if (version !== undefined) versions.shadcn = version
  }
  return versions
}

function runOne(spec: RunSpec, dryRun: boolean): void {
  const { config } = loadBenchConfig()
  const mode = resolveMode(spec.mode)
  let model = spec.model ?? config.model
  let preflightFailure: string | undefined
  try {
    model = modelFor(mode, spec.model, config.model)
  } catch (error) {
    preflightFailure = error instanceof Error ? error.message : String(error)
  }
  const prompt = loadPrompt(spec.promptId)
  const runId = `${spec.mode}--${spec.promptId}--${spec.attempt}`
  const runDir = path.join(benchRoot, runsDirFor(mode.agent, spec.model), runId)
  if (dryRun) {
    process.stdout.write(`[dry-run] ${runId} fixture=${prompt.fixture} model=${model}\n`)
    return
  }
  fs.rmSync(runDir, { recursive: true, force: true })
  fs.mkdirSync(runDir, { recursive: true })
  const cloneDir = path.join(runDir, "repo")

  const startedAt = Date.now()
  let failure: string | undefined
  let repairIterations = 0
  let hookRuntimeMs = 0
  let sourceCommit: string | undefined
  let recordedToolVersions: Record<string, string> = {}
  const fixtureDir = path.join(cloneDir, "fixtures", prompt.fixture)
  const hookLog = path.join(runDir, "hook-log.jsonl")

  try {
    if (preflightFailure !== undefined) throw new Error(preflightFailure)
    // 1-2. fresh checkout + install. With SNAPLINE_BENCH_TEMPLATE set, a
    // byte-identical copy-on-write copy (APFS clonefile) of a pristine
    // installed+built checkout replaces the per-cell clone+install+build —
    // identical isolation, ~2 minutes less overhead per cell. The template's
    // commit SHA is recorded alongside the run.
    const template = process.env.SNAPLINE_BENCH_TEMPLATE
    if (template !== undefined && template.length > 0 && fs.existsSync(template)) {
      execFileSync("cp", ["-c", "-R", template, cloneDir], { stdio: "pipe", timeout: 300000 })
    } else {
      git(benchRoot, ["clone", "--quiet", repoRoot, cloneDir])
      execFileSync("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], {
        cwd: cloneDir,
        stdio: "pipe",
        timeout: 600000,
      })
      execFileSync("pnpm", ["build"], { cwd: cloneDir, stdio: "pipe", timeout: 600000 })
    }
    sourceCommit = git(cloneDir, ["rev-parse", "HEAD"]).trim()
    fs.writeFileSync(path.join(runDir, "template-sha.txt"), sourceCommit + "\n")

    // 3. mode setup, committed so the agent diff is only the agent's work
    mode.prepare(fixtureDir, cloneDir)
    recordedToolVersions = toolVersions(fixtureDir)
    git(cloneDir, ["add", "-A"])
    git(cloneDir, [
      "-c",
      "user.email=bench@snapline",
      "-c",
      "user.name=bench",
      "commit",
      "-qm",
      `bench setup: ${mode.id}`,
      "--allow-empty",
    ])

    // 4. run the agent
    const invocation = mode.invocation(prompt.body, model)
    const agentResult = spawnSync(invocation.cmd, [...invocation.args], {
      cwd: fixtureDir,
      encoding: "utf8",
      timeout: 1800000,
      killSignal: "SIGKILL",
      maxBuffer: 50 * 1024 * 1024,
      env: { ...process.env, ...invocation.env, SNAPLINE_HOOK_LOG: hookLog },
    })
    fs.writeFileSync(path.join(runDir, "agent-stdout.txt"), agentResult.stdout ?? "")
    fs.writeFileSync(path.join(runDir, "agent-stderr.txt"), agentResult.stderr ?? "")
    if (agentResult.error) failure = `agent spawn failed: ${agentResult.error.message}`
    else if (agentResult.status !== 0) failure = `agent exited ${agentResult.status}`
  } catch (error) {
    failure = `setup failed: ${error instanceof Error ? error.message : String(error)}`
  }

  // 5. score whatever state exists — including failures, which are recorded as such
  const diff = (() => {
    try {
      return git(cloneDir, ["diff", "HEAD"])
    } catch {
      return ""
    }
  })()
  fs.writeFileSync(path.join(runDir, "diff.patch"), diff)
  if (fs.existsSync(hookLog)) {
    for (const line of fs.readFileSync(hookLog, "utf8").split("\n")) {
      if (line.trim().length === 0) continue
      const entry = JSON.parse(line) as { action: string; durationMs: number }
      hookRuntimeMs += entry.durationMs
      if (entry.action === "block") repairIterations++
    }
  }
  const scan =
    failure === undefined || fs.existsSync(fixtureDir) ? scoreOutput(fixtureDir) : undefined
  const scannerJsonPath = path.join(runDir, "scanner.json")
  fs.writeFileSync(scannerJsonPath, JSON.stringify(scan ?? { failure }, null, 2))

  const run: BenchmarkRun = {
    id: runId,
    timestamp: new Date(startedAt).toISOString(),
    mode: mode.id as BenchmarkMode,
    fixture: prompt.fixture,
    promptId: prompt.id,
    attempt: spec.attempt,
    model,
    agent: mode.agent,
    environment: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      sourceCommit,
      agentVersion: commandVersion(mode.invocation("", model).cmd),
      toolVersions: recordedToolVersions,
    },
    result: {
      score: scan?.score ?? {
        driftScore: 0,
        totalViolations: 0,
        errorViolations: 0,
        warningViolations: 0,
        rawHexValues: 0,
        inlineStyleObjects: 0,
        arbitraryTailwindValues: 0,
        rawPaletteClasses: 0,
        rawPrimitiveCount: 0,
        duplicateComponentCount: 0,
        componentReuseRate: 0,
      },
      buildPass: failure === undefined && typecheckPass(fixtureDir),
      typecheckPass: failure === undefined && typecheckPass(fixtureDir),
      repairIterations,
      hookRuntimeMs,
      totalWallTimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      filesTouched: filesTouched(fixtureDir),
      failure,
    },
    rawOutputPaths: [
      path.relative(benchRoot, path.join(runDir, "agent-stdout.txt")),
      path.relative(benchRoot, path.join(runDir, "agent-stderr.txt")),
    ],
    scannerJsonPath: path.relative(benchRoot, scannerJsonPath),
    gitDiffPath: path.relative(benchRoot, path.join(runDir, "diff.patch")),
  }
  fs.writeFileSync(path.join(runDir, "run.json"), JSON.stringify(run, null, 2))

  // Disk hygiene: metrics, raw logs, diff, and final source files are captured
  // above — node_modules and git objects in the throwaway clone are not
  // artifacts and would cost ~100MB × runs across a full matrix.
  for (const disposable of ["node_modules", ".git"]) {
    fs.rmSync(path.join(cloneDir, disposable), { recursive: true, force: true })
  }
  try {
    for (const entry of fs.readdirSync(cloneDir)) {
      const nested = path.join(cloneDir, entry, "node_modules")
      if (fs.existsSync(nested)) fs.rmSync(nested, { recursive: true, force: true })
    }
    for (const fixture of fs.readdirSync(path.join(cloneDir, "fixtures"))) {
      const nested = path.join(cloneDir, "fixtures", fixture, "node_modules")
      if (fs.existsSync(nested)) fs.rmSync(nested, { recursive: true, force: true })
    }
  } catch {
    // best-effort cleanup only
  }

  process.stdout.write(
    `${runId}: ${failure !== undefined ? `FAILED (${failure})` : `drift=${run.result.score.driftScore} reuse=${run.result.score.componentReuseRate}`}\n`,
  )
}

function main(): void {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes("--dry-run")
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name)
    return i !== -1 ? argv[i + 1] : undefined
  }
  const { config } = loadBenchConfig()
  const model = flag("--model")
  const specs: RunSpec[] = []
  if (argv.includes("--all")) {
    for (const mode of config.modes) {
      for (const promptId of listPromptIds()) {
        for (let attempt = 1; attempt <= config.runsPerMode; attempt++) {
          specs.push({ mode, promptId, attempt, model })
        }
      }
    }
  } else {
    const mode = flag("--mode")
    const promptId = flag("--prompt")
    if (mode === undefined || promptId === undefined) {
      process.stderr.write(
        "Usage: run-agent --mode <id> --prompt <id> [--attempt N] [--model <id>] | --all [--dry-run]\n",
      )
      process.exit(1)
    }
    specs.push({ mode, promptId, attempt: Number(flag("--attempt") ?? "1"), model })
  }
  for (const spec of specs) runOne(spec, dryRun)
  if (!dryRun) {
    process.stdout.write('Runs complete. Generate the report with "pnpm bench:report".\n')
  }
}

main()

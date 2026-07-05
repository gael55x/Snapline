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
import path from "node:path"
import process from "node:process"
import type { BenchmarkMode, BenchmarkRun } from "@usesnapline/contracts"
import { loadBenchConfig, loadPrompt, listPromptIds, benchRoot, repoRoot } from "./config.js"
import { resolveMode } from "./run-mode.js"
import { scoreOutput, typecheckPass, filesTouched } from "./score-output.js"

interface RunSpec {
  readonly mode: string
  readonly promptId: string
  readonly attempt: number
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
}

function runOne(spec: RunSpec, dryRun: boolean): void {
  const { config } = loadBenchConfig()
  const mode = resolveMode(spec.mode)
  const prompt = loadPrompt(spec.promptId)
  const runId = `${spec.mode}--${spec.promptId}--${spec.attempt}`
  const runDir = path.join(benchRoot, "runs", runId)
  if (dryRun) {
    process.stdout.write(`[dry-run] ${runId} fixture=${prompt.fixture} model=${config.model}\n`)
    return
  }
  fs.rmSync(runDir, { recursive: true, force: true })
  fs.mkdirSync(runDir, { recursive: true })
  const cloneDir = path.join(runDir, "repo")

  const startedAt = Date.now()
  let failure: string | undefined
  let repairIterations = 0
  let hookRuntimeMs = 0
  const fixtureDir = path.join(cloneDir, "fixtures", prompt.fixture)
  const hookLog = path.join(runDir, "hook-log.jsonl")

  try {
    // 1-2. fresh checkout + install
    git(benchRoot, ["clone", "--quiet", repoRoot, cloneDir])
    execFileSync("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], {
      cwd: cloneDir,
      stdio: "pipe",
      timeout: 600000,
    })
    execFileSync("pnpm", ["build"], { cwd: cloneDir, stdio: "pipe", timeout: 600000 })

    // 3. mode setup, committed so the agent diff is only the agent's work
    mode.prepare(fixtureDir, cloneDir)
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
    const invocation = mode.invocation(prompt.body, config.model)
    const agentResult = spawnSync(invocation.cmd, [...invocation.args], {
      cwd: fixtureDir,
      encoding: "utf8",
      timeout: 1800000,
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
    model: config.model,
    agent: "claude",
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
  const specs: RunSpec[] = []
  if (argv.includes("--all")) {
    for (const mode of config.modes) {
      for (const promptId of listPromptIds()) {
        for (let attempt = 1; attempt <= config.runsPerMode; attempt++) {
          specs.push({ mode, promptId, attempt })
        }
      }
    }
  } else {
    const mode = flag("--mode")
    const promptId = flag("--prompt")
    if (mode === undefined || promptId === undefined) {
      process.stderr.write(
        "Usage: run-agent --mode <id> --prompt <id> [--attempt N] | --all [--dry-run]\n",
      )
      process.exit(1)
    }
    specs.push({ mode, promptId, attempt: Number(flag("--attempt") ?? "1") })
  }
  for (const spec of specs) runOne(spec, dryRun)
  if (!dryRun) {
    process.stdout.write('Runs complete. Generate the report with "pnpm bench:report".\n')
  }
}

main()

#!/usr/bin/env node
import process from "node:process"
import { runInit } from "./commands/init.js"
import { runInstall } from "./commands/install.js"
import { runScan } from "./commands/scan.js"
import { runScore } from "./commands/score.js"
import { runFix } from "./commands/fix.js"
import { runDoctor } from "./commands/doctor.js"
import { runHookCommand } from "./commands/hook.js"
import { runBenchmark } from "./commands/benchmark.js"

const HELP = `snapline — keep AI-generated UI on-system

Usage:
  snapline init                      Detect the project and write snapline.yml
  snapline install <claude|codex|cursor>
  snapline scan [--changed] [--json]
  snapline score [--json]
  snapline fix --safe [--dry-run]
  snapline doctor
  snapline hook <claude|codex> <post-tool-use|stop>
  snapline benchmark [graph]

Flags:
  --json    Machine-readable output
  --debug   Full stack traces on errors
  --help    This message
`

export interface CliContext {
  readonly cwd: string
  readonly args: readonly string[]
  readonly flags: ReadonlySet<string>
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = new Set(argv.filter((a) => a.startsWith("--")))
  const args = argv.filter((a) => !a.startsWith("--"))
  const ctx: CliContext = { cwd: process.cwd(), args: args.slice(1), flags }
  const command = args[0]

  if (command === undefined || flags.has("--help")) {
    process.stdout.write(HELP)
    return 0
  }

  try {
    switch (command) {
      case "init":
        return runInit(ctx)
      case "install":
        return runInstall(ctx)
      case "scan":
        return runScan(ctx)
      case "score":
        return runScore(ctx)
      case "fix":
        return runFix(ctx)
      case "doctor":
        return runDoctor(ctx)
      case "hook":
        return await runHookCommand(ctx)
      case "benchmark":
        return runBenchmark(ctx)
      default:
        process.stderr.write(`Unknown command: ${command}\n\n${HELP}`)
        return 1
    }
  } catch (error) {
    if (flags.has("--debug")) throw error
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`snapline: ${message}\n(run with --debug for a stack trace)\n`)
    return 1
  }
}

// Set exitCode instead of calling process.exit(): exit() truncates stdout that
// hasn't flushed yet, which corrupts large --json output on piped stdio.
main().then((code) => {
  process.exitCode = code
})

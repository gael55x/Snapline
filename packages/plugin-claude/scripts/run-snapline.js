// Shared launcher for the Snapline plugin hooks. Plain Node, zero deps.
// Finds the snapline CLI (project-local install first, then PATH) and forwards
// the hook payload. Launcher failures stay non-blocking but are returned to
// Claude as visible context so enforcement never disappears silently.
"use strict"

const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

function findSnapline(cwd) {
  const local = path.join(cwd, "node_modules", ".bin", "snapline")
  if (fs.existsSync(local)) return local
  return "snapline" // rely on PATH
}

function runHook(kind) {
  const stdin = fs.readFileSync(0, "utf8")
  const cwd = process.cwd()
  const result = spawnSync(findSnapline(cwd), ["hook", "claude", kind], {
    cwd,
    input: stdin,
    encoding: "utf8",
    timeout: 30000,
  })
  if (result.error) {
    const detail =
      result.error.code === "ENOENT"
        ? "Snapline CLI not found. Install it with: npm i -D @usesnapline/cli"
        : `Snapline hook launcher failed: ${result.error.message}`
    const hookEventName = kind === "stop" ? "Stop" : "PostToolUse"
    process.stdout.write(
      `${JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: detail } })}\n`,
    )
    process.stderr.write(`${detail} (hook allowed)\n`)
    process.exit(0)
  }
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.exit(result.status === null ? 0 : result.status)
}

module.exports = { runHook }

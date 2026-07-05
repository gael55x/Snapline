// Shared launcher for the Snapline plugin hooks. Plain Node, zero deps.
// Finds the snapline CLI (project-local install first, then PATH) and forwards
// the hook payload. If the CLI is missing, the hook stays silent and allows —
// a missing scanner must never break a Claude session.
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
  let cwd = process.cwd()
  try {
    const payload = JSON.parse(stdin)
    if (typeof payload.cwd === "string") cwd = payload.cwd
  } catch {
    // fall through with process cwd
  }
  const result = spawnSync(findSnapline(cwd), ["hook", "claude", kind], {
    cwd,
    input: stdin,
    encoding: "utf8",
    timeout: 30000,
  })
  if (result.error) {
    // CLI not installed — allow silently, hint once on stderr (visible in --debug).
    process.stderr.write(
      "snapline CLI not found; install with: npm i -D @usesnapline/cli (hook allowed)\n",
    )
    process.exit(0)
  }
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.exit(result.status === null ? 0 : result.status)
}

module.exports = { runHook }

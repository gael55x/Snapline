import { execFileSync } from "node:child_process"
import type { HookDecision, HookEvent } from "@usesnapline/contracts"
import { loadConfig } from "../config.js"
import { buildScanDeps, scanFiles, isScannableFile } from "../scanner/scan-project.js"
import { decideFromScan } from "./decide.js"

/** Changed + untracked files per git, project-root-relative. Empty when not a git repo. */
export function gitChangedFiles(cwd: string): string[] {
  try {
    const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd, encoding: "utf8" })
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd,
      encoding: "utf8",
    })
    return [...new Set([...tracked.split("\n"), ...untracked.split("\n")])]
      .map((f) => f.trim())
      .filter((f) => f.length > 0)
      .sort()
  } catch {
    return []
  }
}

/**
 * Run the scan for a normalized hook event and decide.
 * post-tool-use scans only the event's files; stop scans the git-changed set.
 * Never throws: a hook must not break the agent session.
 */
export function runHook(event: HookEvent): HookDecision {
  try {
    const files = (
      event.kind === "stop" && event.filePaths.length === 0
        ? gitChangedFiles(event.cwd)
        : [...event.filePaths]
    ).filter(isScannableFile)
    if (files.length === 0) return { action: "allow", contracts: [] }
    const { config } = loadConfig(event.cwd)
    const result = scanFiles(event.cwd, files, buildScanDeps(event.cwd, config))
    return decideFromScan(event, result)
  } catch {
    return { action: "allow", contracts: [] }
  }
}

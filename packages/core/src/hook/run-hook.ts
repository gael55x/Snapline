import { execFileSync } from "node:child_process"
import type { HookDecision, HookEvent } from "@usesnapline/contracts"
import { loadConfig } from "../config.js"
import { buildScanDeps, scanFiles, isScannableFile } from "../scanner/scan-project.js"
import { decideFromScan } from "./decide.js"

/**
 * Changed + untracked files per git, relative to cwd. --relative keeps paths
 * correct when the project lives in a subdirectory of the git root (monorepos).
 * Empty when not a git repo.
 */
export function gitChangedFiles(cwd: string): string[] {
  const gitLines = (args: readonly string[]): string[] => {
    try {
      return execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .split("\n")
        .map((file) => file.trim())
        .filter(Boolean)
    } catch {
      return []
    }
  }

  const tracked = gitLines(["diff", "--relative", "--name-only", "HEAD"])
  const untracked = gitLines(["ls-files", "--others", "--exclude-standard"])
  return [...new Set([...tracked, ...untracked])].sort()
}

/**
 * Run the scan for a normalized hook event and decide.
 * post-tool-use scans only the event's files; stop scans the git-changed set.
 * Never throws: a hook must not break the agent session. Internal failures are
 * returned as visible warning context so enforcement never disappears silently.
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
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return {
      action: "warn",
      agentMessage: `SNAPLINE COULD NOT ANALYZE UI\n\n${detail}\n\nRun "snapline doctor" and "snapline scan --changed" before finishing.`,
      contracts: [],
    }
  }
}

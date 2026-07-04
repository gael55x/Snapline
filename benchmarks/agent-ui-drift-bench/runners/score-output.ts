import { execFileSync } from "node:child_process"
import type { ScanResult } from "@usesnapline/contracts"
import { loadConfig, scanProject } from "@usesnapline/core"

/** Scan a run's fixture directory with its own snapline.yml (or defaults). */
export function scoreOutput(fixtureDir: string): ScanResult {
  const { config } = loadConfig(fixtureDir)
  return scanProject(fixtureDir, config)
}

/** Fixture "build" gate: tsc --noEmit (fixtures are typecheck-verified, not next-built). */
export function typecheckPass(fixtureDir: string): boolean {
  try {
    execFileSync("npx", ["--no-install", "tsc", "--noEmit"], {
      cwd: fixtureDir,
      stdio: "pipe",
      timeout: 300000,
    })
    return true
  } catch {
    return false
  }
}

export function filesTouched(fixtureDir: string): number {
  try {
    const out = execFileSync("git", ["status", "--porcelain"], {
      cwd: fixtureDir,
      encoding: "utf8",
    })
    return out.split("\n").filter((l) => l.trim().length > 0).length
  } catch {
    return 0
  }
}

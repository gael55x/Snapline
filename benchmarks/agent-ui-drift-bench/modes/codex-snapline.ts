import { execFileSync } from "node:child_process"
import path from "node:path"
import { codexInvocation, type BenchMode } from "./types.js"
import { installSnapline } from "./shared.js"

/** Codex + Snapline instructions in AGENTS.md. No Codex hook gate exists yet. */
export const codexSnapline: BenchMode = {
  id: "codex-snapline",
  agent: "codex",
  description: "Codex CLI + Snapline AGENTS.md instructions (instruction-level, no gate)",
  prepare(fixtureDir, repoRoot) {
    installSnapline(fixtureDir, repoRoot)
    execFileSync(path.join(fixtureDir, "node_modules", ".bin", "snapline"), ["install", "codex"], {
      cwd: fixtureDir,
      stdio: "pipe",
      timeout: 60000,
    })
  },
  invocation: codexInvocation,
}

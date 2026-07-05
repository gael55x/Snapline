import type { BenchmarkMode } from "@usesnapline/contracts"
import type { BenchMode } from "../modes/types.js"
import { claudeRaw } from "../modes/claude-raw.js"
import { claudeProjectInstructions } from "../modes/claude-project-instructions.js"
import { claudeShadcnMcp } from "../modes/claude-shadcn-mcp.js"
import { claudeTailwindEslint } from "../modes/claude-tailwind-eslint.js"
import { claudeBuoy } from "../modes/claude-buoy.js"
import { claudeDriftGuard } from "../modes/claude-drift-guard.js"
import { claudeSnapline } from "../modes/claude-snapline.js"
import { claudeShadcnMcpSnapline } from "../modes/claude-shadcn-mcp-snapline.js"
import { codexRaw } from "../modes/codex-raw.js"
import { codexSnapline } from "../modes/codex-snapline.js"

export const ALL_MODES: readonly BenchMode[] = [
  claudeRaw,
  claudeProjectInstructions,
  claudeShadcnMcp,
  claudeTailwindEslint,
  claudeBuoy,
  claudeDriftGuard,
  claudeSnapline,
  claudeShadcnMcpSnapline,
  codexRaw,
  codexSnapline,
]

export function resolveMode(id: string): BenchMode {
  const mode = ALL_MODES.find((m) => m.id === (id as BenchmarkMode))
  if (mode === undefined) {
    throw new Error(`Unknown mode "${id}". Known: ${ALL_MODES.map((m) => m.id).join(", ")}`)
  }
  return mode
}

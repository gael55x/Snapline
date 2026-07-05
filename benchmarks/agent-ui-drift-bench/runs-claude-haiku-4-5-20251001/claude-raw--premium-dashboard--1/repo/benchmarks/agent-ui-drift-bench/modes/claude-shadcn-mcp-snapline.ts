import { claudeInvocation, type BenchMode } from "./types.js"
import { installSnapline, writeShadcnMcpConfig } from "./shared.js"

/** Discovery + enforcement: shadcn MCP for finding components, Snapline for staying on-system. */
export const claudeShadcnMcpSnapline: BenchMode = {
  id: "claude-shadcn-mcp-snapline",
  agent: "claude",
  description: "Claude Code + shadcn MCP + Snapline hooks (discovery plus enforcement)",
  prepare(fixtureDir, repoRoot) {
    writeShadcnMcpConfig(fixtureDir)
    installSnapline(fixtureDir, repoRoot)
  },
  invocation: claudeInvocation,
}

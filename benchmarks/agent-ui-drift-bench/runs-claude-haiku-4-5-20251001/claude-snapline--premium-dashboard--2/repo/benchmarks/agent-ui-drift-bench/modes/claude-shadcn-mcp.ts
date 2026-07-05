import { claudeInvocation, type BenchMode } from "./types.js"
import { writeShadcnMcpConfig } from "./shared.js"

/** shadcn MCP: component discovery/scaffolding via MCP. Helps pick components; does not police classes. */
export const claudeShadcnMcp: BenchMode = {
  id: "claude-shadcn-mcp",
  agent: "claude",
  description: "Claude Code with the shadcn MCP server configured (.mcp.json)",
  prepare(fixtureDir) {
    writeShadcnMcpConfig(fixtureDir)
  },
  invocation: claudeInvocation,
}

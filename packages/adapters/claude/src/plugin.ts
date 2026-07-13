import type { PluginMetadata } from "@usesnapline/contracts"
import packageJson from "../package.json" with { type: "json" }

/**
 * Canonical metadata for the Snapline Claude Code plugin. The plugin package
 * (packages/plugin-claude) mirrors this; keywords also live in package.json
 * because the official plugin.json schema supports a keywords field.
 */
export const SNAPLINE_PLUGIN_METADATA: PluginMetadata = {
  name: "snapline",
  version: packageJson.version,
  description:
    "Keep AI-generated UI on-system. Scans edited TSX for design-system drift and returns repair contracts before the agent can finish.",
  homepage: "https://github.com/gael55x/Snapline",
  repository: "https://github.com/gael55x/Snapline",
  license: "MIT",
  keywords: [
    "ai-coding-agent",
    "agent-hooks",
    "claude-code",
    "codex",
    "cursor",
    "tailwindcss",
    "shadcn-ui",
    "react",
    "nextjs",
    "design-system",
    "ui-drift",
    "repair-contracts",
    "developer-tools",
    "open-source",
  ],
}

import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@usesnapline/contracts": path.join(here, "packages/contracts/src/index.ts"),
      "@usesnapline/core": path.join(here, "packages/core/src/index.ts"),
      "@usesnapline/claude": path.join(here, "packages/adapters/claude/src/index.ts"),
      "@usesnapline/codex": path.join(here, "packages/adapters/codex/src/index.ts"),
      "@usesnapline/cursor": path.join(here, "packages/adapters/cursor/src/index.ts"),
    },
  },
  test: {
    include: [
      "packages/**/tests/**/*.test.ts",
      "packages/**/src/**/*.test.ts",
      "benchmarks/**/tests/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "benchmarks/**/runs/**"],
  },
})

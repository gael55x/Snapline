import fs from "node:fs"
import path from "node:path"
import { claudeInvocation, type BenchMode } from "./types.js"
import { npmInstall } from "./shared.js"

const ESLINT_CONFIG = `import tailwind from "eslint-plugin-tailwindcss"

export default [
  ...tailwind.configs["flat/recommended"],
  {
    rules: {
      "tailwindcss/no-arbitrary-value": "error",
      "tailwindcss/no-custom-classname": "warn",
    },
  },
]
`

/** Lint-based: eslint-plugin-tailwindcss with the agent told to keep lint clean. */
export const claudeTailwindEslint: BenchMode = {
  id: "claude-tailwind-eslint",
  agent: "claude",
  description: "Claude Code + eslint-plugin-tailwindcss; agent instructed to keep eslint clean",
  prepare(fixtureDir) {
    npmInstall(fixtureDir, ["eslint@9.17.0", "eslint-plugin-tailwindcss@3.17.0"])
    fs.writeFileSync(path.join(fixtureDir, "eslint.config.js"), ESLINT_CONFIG)
    fs.writeFileSync(
      path.join(fixtureDir, "CLAUDE.md"),
      // Intentionally lint-only guidance: design rules come from the linter, so
      // this mode measures linting, not instruction quality.
      `Run "npx eslint src" after editing UI files and fix every reported problem before finishing.\n`,
    )
  },
  invocation: claudeInvocation,
}

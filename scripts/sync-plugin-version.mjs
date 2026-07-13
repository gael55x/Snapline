import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const packagePaths = [
  "packages/contracts/package.json",
  "packages/core/package.json",
  "packages/adapters/claude/package.json",
  "packages/adapters/codex/package.json",
  "packages/adapters/cursor/package.json",
  "packages/cli/package.json",
  "packages/plugin-claude/package.json",
]
const packages = packagePaths.map((relative) => ({
  relative,
  json: JSON.parse(fs.readFileSync(path.join(root, relative), "utf8")),
}))
const versions = new Set(packages.map((entry) => entry.json.version))
if (versions.size !== 1) {
  process.stderr.write(
    `Snapline package versions differ:\n${packages.map((entry) => `- ${entry.relative}: ${entry.json.version}`).join("\n")}\n`,
  )
  process.exit(1)
}

const version = packages[0].json.version
const manifestPath = path.join(root, "packages/plugin-claude/.claude-plugin/plugin.json")
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
if (process.argv.includes("--check")) {
  if (manifest.version !== version) {
    process.stderr.write(`Claude plugin manifest is ${manifest.version}; expected ${version}.\n`)
    process.exit(1)
  }
  process.stdout.write(`Release metadata is synchronized at ${version}.\n`)
} else {
  manifest.version = version
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  process.stdout.write(`Claude plugin manifest updated to ${version}.\n`)
}

// docs:check — every `snapline <command>` mentioned in README/docs must exist
// in the CLI, and every relative doc link must resolve. Keeps docs honest.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

const KNOWN_COMMANDS = new Set([
  "init",
  "install",
  "uninstall",
  "scan",
  "score",
  "fix",
  "doctor",
  "hook",
  "benchmark",
])

const docFiles = [
  path.join(root, "README.md"),
  ...fs
    .readdirSync(path.join(root, "docs"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(root, "docs", f)),
  path.join(root, "packages", "plugin-claude", "README.md"),
  path.join(root, "packages", "cli", "README.md"),
  path.join(root, "benchmarks", "agent-ui-drift-bench", "README.md"),
]

const errors = []

for (const file of docFiles) {
  const text = fs.readFileSync(file, "utf8")
  const rel = path.relative(root, file)

  // 1. documented snapline commands exist — checked only in code contexts
  //    (fenced blocks and inline code), so prose like "snapline scans the file"
  //    and the @usesnapline npm scope don't false-positive.
  const codeText = [
    ...[...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]),
    ...[...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]),
  ].join("\n")
  for (const match of codeText.matchAll(/(?:^|[ \t"'(])snapline[ \t]+([a-z][a-z-]*)/gm)) {
    const command = match[1]
    if (!KNOWN_COMMANDS.has(command)) {
      errors.push(`${rel}: documents unknown command "snapline ${command}"`)
    }
  }

  // 2. relative markdown links resolve
  for (const match of text.matchAll(/\]\((?!https?:|#|mailto:)([^)]+?)(?:#[^)]*)?\)/g)) {
    const target = match[1]
    const resolved = path.resolve(path.dirname(file), target)
    if (!fs.existsSync(resolved)) {
      errors.push(`${rel}: broken link -> ${target}`)
    }
  }

  // 3. no public references to the dead codename
  if (/\bplumb\b/i.test(text)) {
    errors.push(`${rel}: references the dead codename`)
  }
}

// 4. Every graph the README embeds must exist
const readmeText = fs.readFileSync(path.join(root, "README.md"), "utf8")
for (const match of readmeText.matchAll(/\]\((benchmarks\/[^)]+\.svg)\)/g)) {
  if (!fs.existsSync(path.join(root, match[1]))) {
    errors.push(`README embeds missing graph: ${match[1]} — run pnpm bench:graph`)
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`✖ ${error}`)
  process.exit(1)
}
console.log(`✔ docs:check passed (${docFiles.length} files)`)

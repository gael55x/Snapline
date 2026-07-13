import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const packageDirs = [
  "packages/contracts",
  "packages/core",
  "packages/adapters/claude",
  "packages/adapters/codex",
  "packages/adapters/cursor",
  "packages/cli",
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-package-smoke-"))
try {
  const tarballsDir = path.join(temporary, "tarballs")
  fs.mkdirSync(tarballsDir)
  const tarballs = []
  for (const relative of packageDirs) {
    const before = new Set(fs.readdirSync(tarballsDir))
    execFileSync("pnpm", ["pack", "--pack-destination", tarballsDir], {
      cwd: path.join(root, relative),
      stdio: "pipe",
    })
    const created = fs.readdirSync(tarballsDir).find((file) => !before.has(file))
    assert(created !== undefined, `${relative}: pnpm pack did not create a tarball`)
    const tarball = path.join(tarballsDir, created)
    tarballs.push(tarball)

    const members = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" }).trim().split("\n")
    assert(
      !members.some((file) => /(?:fixtures|runs-data|logo-reference)/.test(file)),
      `${created}: internal files shipped`,
    )
    if (relative === "packages/cli") {
      assert(members.includes("package/README.md"), "CLI tarball is missing README.md")
      assert(members.includes("package/LICENSE"), "CLI tarball is missing LICENSE")
    }
    for (const member of members.filter((file) =>
      /(?:\.m?js|\.d\.ts|\.json|README\.md|LICENSE)$/.test(file),
    )) {
      const content = execFileSync("tar", ["-xOzf", tarball, member], {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
      })
      assert(
        !/\b(?:plumb|latch)\b/i.test(content),
        `${created}:${member}: retired branding shipped`,
      )
    }
  }

  const consumer = path.join(temporary, "consumer")
  fs.mkdirSync(consumer)
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify({ name: "snapline-package-smoke", private: true, version: "0.0.0" }, null, 2) +
      "\n",
  )
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", ...tarballs],
    { cwd: consumer, stdio: "pipe", timeout: 300000 },
  )

  fs.mkdirSync(path.join(consumer, "src"))
  fs.writeFileSync(path.join(consumer, "tailwind.config.js"), "export default {}\n")
  fs.writeFileSync(
    path.join(consumer, "src", "clean.tsx"),
    'export const Clean = () => <main className="text-foreground" />\n',
  )
  fs.writeFileSync(
    path.join(consumer, "src", "dirty.tsx"),
    'export const Dirty = () => <main style={{ color: "#fff" }} />\n',
  )
  execFileSync("git", ["init"], { cwd: consumer, stdio: "ignore" })

  const bin = path.join(consumer, "node_modules", ".bin", "snapline")
  const expectedVersion = JSON.parse(
    fs.readFileSync(path.join(root, "packages", "cli", "package.json"), "utf8"),
  ).version
  assert(
    execFileSync(bin, ["--version"], { cwd: consumer, encoding: "utf8" }).trim() ===
      expectedVersion,
    "packed CLI reported the wrong version",
  )
  execFileSync(bin, ["init"], { cwd: consumer, stdio: "pipe" })
  const clean = JSON.parse(
    execFileSync(bin, ["scan", "src/clean.tsx", "--json"], {
      cwd: consumer,
      encoding: "utf8",
    }),
  )
  assert(clean.schemaVersion === 1 && clean.violations.length === 0, "packed clean scan failed")
  const dirty = spawnSync(bin, ["scan", "src/dirty.tsx", "--json"], {
    cwd: consumer,
    encoding: "utf8",
  })
  assert(dirty.status === 1, "packed dirty scan did not return exit 1")
  const dirtyResult = JSON.parse(dirty.stdout)
  assert(
    dirtyResult.schemaVersion === 1 && dirtyResult.violations.length > 0,
    "packed dirty scan had no findings",
  )

  for (const agent of ["claude", "codex", "cursor"]) {
    execFileSync(bin, ["install", agent], { cwd: consumer, stdio: "pipe" })
    execFileSync(bin, ["doctor", agent], { cwd: consumer, stdio: "pipe" })
    execFileSync(bin, ["uninstall", agent], { cwd: consumer, stdio: "pipe" })
  }

  const sizes = Object.fromEntries(
    tarballs.map((file) => [path.basename(file), fs.statSync(file).size]),
  )
  process.stdout.write(`Packed-package smoke passed: ${JSON.stringify(sizes)}\n`)
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}

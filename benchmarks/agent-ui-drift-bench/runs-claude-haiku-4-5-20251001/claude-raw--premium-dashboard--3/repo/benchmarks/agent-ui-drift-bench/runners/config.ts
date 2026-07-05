import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const benchRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
export const repoRoot = path.join(benchRoot, "..", "..")

export interface BenchConfig {
  readonly benchmark: string
  readonly scorer: string
  readonly runsPerMode: number
  readonly model: string
  readonly agentCommand: string
  readonly fixtures: readonly string[]
  readonly modes: readonly string[]
  readonly minRunsForPublicGraph: number
}

export function loadBenchConfig(): { config: BenchConfig; configHash: string } {
  const file = path.join(benchRoot, "benchmark.config.json")
  const text = fs.readFileSync(file, "utf8")
  return {
    config: JSON.parse(text) as BenchConfig,
    configHash: crypto.createHash("sha256").update(text).digest("hex").slice(0, 16),
  }
}

export interface PromptFile {
  readonly id: string
  readonly title: string
  readonly fixture: string
  readonly category: string
  readonly targetPath: string
  readonly body: string
}

/** Parse a prompt markdown file's YAML frontmatter + body. */
export function loadPrompt(promptId: string): PromptFile {
  const file = path.join(benchRoot, "prompts", `${promptId}.md`)
  const text = fs.readFileSync(file, "utf8")
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text)
  if (match === null) throw new Error(`Prompt ${promptId} has no frontmatter`)
  const meta: Record<string, string> = {}
  for (const line of match[1]!.split("\n")) {
    const kv = /^([a-zA-Z]+):\s*(.+?)\s*(?:#.*)?$/.exec(line)
    if (kv !== null) meta[kv[1]!] = kv[2]!
  }
  return {
    id: meta.id ?? promptId,
    title: meta.title ?? promptId,
    fixture: meta.fixture ?? "next-shadcn-basic",
    category: meta.category ?? "build",
    targetPath: meta.targetPath ?? "",
    body: match[2]!.trim(),
  }
}

export function listPromptIds(): string[] {
  return fs
    .readdirSync(path.join(benchRoot, "prompts"))
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort()
}

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { detectProject, CONFIG_FILE_NAME, DEFAULT_ALLOWED_COLOR_CLASSES } from "@usesnapline/core"
import { installClaudeHooks } from "@usesnapline/claude"
import type { CliContext } from "../main.js"

interface DetectedComponent {
  readonly name: string
  readonly file: string
  readonly preferOver: readonly string[]
}

const KNOWN_COMPONENTS: readonly DetectedComponent[] = [
  { name: "Button", file: "button.tsx", preferOver: ["button"] },
  { name: "Input", file: "input.tsx", preferOver: ["input"] },
  { name: "Dialog", file: "dialog.tsx", preferOver: ['div[role="dialog"]'] },
  { name: "Card", file: "card.tsx", preferOver: ["div[data-card]"] },
]

function componentsYaml(uiDir: string | undefined, root: string, uiAlias: string): string {
  const lines: string[] = ["components:"]
  const present =
    uiDir === undefined
      ? KNOWN_COMPONENTS
      : KNOWN_COMPONENTS.filter((c) => fs.existsSync(path.join(root, uiDir, c.file)))
  for (const component of present.length > 0 ? present : KNOWN_COMPONENTS) {
    lines.push(`  ${component.name}:`)
    lines.push(`    import: "${uiAlias}/${component.file.replace(".tsx", "")}"`)
    lines.push("    preferOver:")
    for (const p of component.preferOver) lines.push(`      - ${JSON.stringify(p)}`)
  }
  return lines.join("\n")
}

function defaultConfigYaml(uiDir: string | undefined, root: string, uiAlias: string): string {
  return `version: 1

stack:
  framework: next
  ui: shadcn
  styling: tailwind

${componentsYaml(uiDir, root, uiAlias)}

tokens:
  colors:
    semanticOnly: true
    allowed:
${DEFAULT_ALLOWED_COLOR_CLASSES.map((c) => `      - ${c}`).join("\n")}

rules:
  noRawHex: error
  noInlineStyle: error
  noArbitraryTailwind: error
  noRawPaletteColor: warn
  requireButtonComponent: error
  requireInputComponent: error
  requireDialogComponent: warn
  requireCardComponent: warn
  noDuplicateComponents: warn

fix:
  safeAutofix: false
  preferAgentRepair: true

benchmark:
  enabled: true
  scorer: ui-drift-score-v1
`
}

/** `snapline init [--claude]` — detect the project and write snapline.yml + .snapline/. */
export function runInit(ctx: CliContext): number {
  const project = detectProject(ctx.cwd)
  const notes: string[] = []
  notes.push(
    project.hasNext
      ? "✔ Next.js detected"
      : "• Next.js not detected (fine — any React/Tailwind project works)",
  )
  notes.push(
    project.hasTailwind
      ? "✔ Tailwind detected"
      : "⚠ Tailwind not detected — Snapline rules assume Tailwind classes",
  )
  notes.push(
    project.componentsJson !== undefined
      ? "✔ shadcn components.json found"
      : "• no components.json (component rules use snapline.yml mappings)",
  )
  notes.push(
    project.uiDir !== undefined
      ? `✔ ui directory: ${project.uiDir}`
      : "⚠ no components/ui directory found",
  )

  const configPath = path.join(ctx.cwd, CONFIG_FILE_NAME)
  if (fs.existsSync(configPath)) {
    notes.push(`• ${CONFIG_FILE_NAME} already exists — left untouched`)
  } else {
    const uiAlias = project.componentsJson?.aliases?.ui ?? "@/components/ui"
    fs.writeFileSync(configPath, defaultConfigYaml(project.uiDir, ctx.cwd, uiAlias))
    notes.push(`✔ wrote ${CONFIG_FILE_NAME}`)
  }

  const stateDir = path.join(ctx.cwd, ".snapline")
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true })
    fs.writeFileSync(path.join(stateDir, ".gitignore"), "*\n")
    notes.push("✔ created .snapline/ (state, self-gitignored)")
  }

  if (ctx.flags.has("--claude")) {
    const install = installClaudeHooks(ctx.cwd)
    notes.push(
      install.changed
        ? `✔ Claude hooks installed in ${path.relative(ctx.cwd, install.settingsPath)}`
        : "• Claude hooks already installed",
    )
  } else {
    notes.push('• next: "snapline install claude" to enable the repair loop')
  }

  process.stdout.write(notes.join("\n") + "\n")
  return 0
}

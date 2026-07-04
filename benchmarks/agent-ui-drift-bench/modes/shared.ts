import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

/** CLAUDE.md used by instruction-based modes. Kept identical across modes that use it. */
export const DESIGN_SYSTEM_INSTRUCTIONS = `# Project instructions

This project uses shadcn/ui with semantic Tailwind tokens.

When writing or editing UI:

- Use components from @/components/ui (Button, Input, Card, Dialog, ...) instead of raw <button>, <input>, or hand-rolled containers.
- Use semantic color classes only: bg-background, bg-primary, text-foreground, text-muted-foreground, border-border, bg-card, bg-destructive. Never use palette classes (bg-blue-500), hex colors, or inline styles.
- Never use arbitrary Tailwind values like mt-[13px] or w-[472px]; stay on the spacing scale.
- Do not create duplicate component files like CustomButton.tsx.
`

export function writeClaudeMd(fixtureDir: string, extra = ""): void {
  fs.writeFileSync(path.join(fixtureDir, "CLAUDE.md"), DESIGN_SYSTEM_INSTRUCTIONS + extra)
}

/** npm-install a competitor tool into the fixture. Throws with the npm error on failure. */
export function npmInstall(fixtureDir: string, packages: readonly string[]): void {
  execFileSync("npm", ["install", "--save-dev", "--no-audit", "--no-fund", ...packages], {
    cwd: fixtureDir,
    stdio: "pipe",
    timeout: 180000,
  })
}

/** Capture a competitor CLI's --help output into SETUP-NOTES.md for reproducibility. */
export function captureHelp(fixtureDir: string, bin: string): void {
  let help = ""
  try {
    help = execFileSync("npx", ["--no-install", bin, "--help"], {
      cwd: fixtureDir,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 60000,
    })
  } catch (error) {
    help = `--help failed: ${error instanceof Error ? error.message : String(error)}`
  }
  fs.appendFileSync(
    path.join(fixtureDir, "SETUP-NOTES.md"),
    `\n## ${bin} --help (captured at setup)\n\n\`\`\`\n${help}\n\`\`\`\n`,
  )
}

/**
 * Install the workspace Snapline CLI into the fixture and wire Claude hooks.
 * The fixture is a pnpm workspace member inside the fresh clone, so the CLI is
 * added as a workspace dependency (npm cannot resolve workspace:* protocols).
 */
export function installSnapline(fixtureDir: string, repoRoot: string): void {
  const pkgPath = path.join(fixtureDir, "package.json")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    devDependencies?: Record<string, string>
  }
  pkg.devDependencies = { ...pkg.devDependencies, "@usesnapline/cli": "workspace:*" }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
  execFileSync("pnpm", ["install", "--no-frozen-lockfile", "--prefer-offline"], {
    cwd: repoRoot,
    stdio: "pipe",
    timeout: 300000,
  })
  execFileSync(path.join(fixtureDir, "node_modules", ".bin", "snapline"), ["init", "--claude"], {
    cwd: fixtureDir,
    stdio: "pipe",
    timeout: 60000,
  })
}

export function writeShadcnMcpConfig(fixtureDir: string): void {
  fs.writeFileSync(
    path.join(fixtureDir, ".mcp.json"),
    JSON.stringify(
      { mcpServers: { shadcn: { command: "npx", args: ["shadcn@latest", "mcp"] } } },
      null,
      2,
    ) + "\n",
  )
}

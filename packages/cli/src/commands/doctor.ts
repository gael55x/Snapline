import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { execFileSync } from "node:child_process"
import {
  loadConfig,
  detectProject,
  buildComponentRegistry,
  CONFIG_FILE_NAME,
  ConfigError,
} from "@usesnapline/core"
import { claudeHooksInstalled } from "@usesnapline/claude"
import { codexHooksInstalled } from "@usesnapline/codex"
import { cursorHooksInstalled } from "@usesnapline/cursor"
import type { CliContext } from "../main.js"

interface Check {
  readonly label: string
  readonly ok: boolean
  readonly detail?: string
  readonly fatal?: boolean
}

/** `snapline doctor` — validate config, aliases, registry, hooks, benchmark deps. */
export function runDoctor(ctx: CliContext): number {
  if (ctx.args.length > 1) {
    process.stderr.write("Usage: snapline doctor [claude|codex|cursor]\n")
    return 1
  }
  const target = ctx.args[0]
  if (target !== undefined && target !== "claude" && target !== "codex" && target !== "cursor") {
    process.stderr.write("Usage: snapline doctor [claude|codex|cursor]\n")
    return 1
  }
  const checks: Check[] = []

  let configOk = true
  try {
    loadConfig(ctx.cwd)
  } catch (error) {
    configOk = false
    checks.push({
      label: `${CONFIG_FILE_NAME} valid`,
      ok: false,
      detail: error instanceof ConfigError ? error.message : String(error),
      fatal: true,
    })
  }
  if (configOk) {
    const { configPath } = loadConfig(ctx.cwd)
    checks.push({
      label: `${CONFIG_FILE_NAME} valid`,
      ok: true,
      detail: configPath === undefined ? "not present — using defaults" : undefined,
    })
  }

  const project = detectProject(ctx.cwd)
  checks.push({ label: "Tailwind detected", ok: project.hasTailwind, fatal: !project.hasTailwind })
  checks.push({
    label: "tsconfig path aliases",
    ok: Object.keys(project.tsconfigPaths).length > 0,
    detail:
      Object.keys(project.tsconfigPaths).join(", ") || "none — component imports resolve literally",
  })

  if (configOk) {
    const { config } = loadConfig(ctx.cwd)
    const registry = buildComponentRegistry(config, ctx.cwd, project.tsconfigPaths, project.uiDir)
    for (const component of registry.components) {
      checks.push({
        label: `component ${component.name} resolves`,
        ok: component.fileExists,
        detail: component.importPath,
      })
    }
  }

  const selectedAgent = target ?? "claude"
  const integrationInstalled =
    selectedAgent === "claude"
      ? claudeHooksInstalled(ctx.cwd)
      : selectedAgent === "codex"
        ? codexHooksInstalled(ctx.cwd)
        : cursorHooksInstalled(ctx.cwd)
  checks.push({
    label: `${selectedAgent[0]?.toUpperCase()}${selectedAgent.slice(1)} hooks installed`,
    ok: integrationInstalled,
    detail: integrationInstalled ? undefined : `run "snapline install ${selectedAgent}"`,
    fatal: target !== undefined && !integrationInstalled,
  })

  const nodeMajor = Number(process.versions.node.split(".")[0])
  checks.push({ label: "Node.js >= 20", ok: nodeMajor >= 20, detail: process.versions.node })
  let gitOk = false
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: ctx.cwd, stdio: "pipe" })
    gitOk = true
  } catch {
    // not a git repo or git missing
  }
  checks.push({
    label: "git repository",
    ok: gitOk,
    detail: gitOk ? undefined : "scan --changed and the Stop hook need git",
    fatal: target !== undefined && !gitOk,
  })
  checks.push({
    label: ".snapline state directory",
    ok: fs.existsSync(path.join(ctx.cwd, ".snapline")),
    detail: fs.existsSync(path.join(ctx.cwd, ".snapline")) ? undefined : 'run "snapline init"',
  })

  for (const check of checks) {
    const mark = check.ok ? "✔" : check.fatal === true ? "✖" : "⚠"
    process.stdout.write(
      `${mark} ${check.label}${check.detail !== undefined ? ` — ${check.detail}` : ""}\n`,
    )
  }
  const fatal = checks.some((c) => !c.ok && c.fatal === true)
  process.stdout.write(fatal ? "\nDoctor found blocking problems.\n" : "\nDoctor finished.\n")
  return fatal ? 1 : 0
}

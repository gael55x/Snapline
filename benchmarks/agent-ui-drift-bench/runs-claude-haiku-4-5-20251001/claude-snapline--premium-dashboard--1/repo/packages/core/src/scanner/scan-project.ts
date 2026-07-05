import fs from "node:fs"
import path from "node:path"
import type { ScanResult, SnaplineConfig, Violation } from "@usesnapline/contracts"
import { detectProject } from "../project/detect-project.js"
import { buildComponentRegistry } from "../registry/component-registry.js"
import { buildTokenRegistry } from "../registry/token-registry.js"
import { scanFile, isUiSourcePath, type ScanFileDeps } from "./scan-file.js"
import { noDuplicateComponents } from "../rules/no-duplicate-components.js"
import { computeScore } from "../scorer/drift-score.js"
import { countComponentReuse } from "../scorer/component-reuse-rate.js"
import { buildRepairContracts } from "../report/agent-report.js"
import type { JsxElementInfo } from "../scanner/extract-jsx-elements.js"

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".git",
  ".snapline",
  ".turbo",
])

const SCANNABLE_EXTENSIONS = [".tsx", ".jsx"]

export function isScannableFile(filePath: string): boolean {
  if (!SCANNABLE_EXTENSIONS.some((ext) => filePath.endsWith(ext))) return false
  if (filePath.endsWith(".d.tsx")) return false
  return filePath.split(path.sep).every((part) => !IGNORED_DIRS.has(part))
}

/** Recursively list scannable files, root-relative with forward slashes, sorted. */
export function listScannableFiles(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          walk(path.join(dir, entry.name))
        }
        continue
      }
      const full = path.join(dir, entry.name)
      const relative = path.relative(root, full).split(path.sep).join("/")
      if (isScannableFile(relative)) out.push(relative)
    }
  }
  walk(root)
  return out.sort()
}

/** Build scanner dependencies (config + registries) for a project root. */
export function buildScanDeps(root: string, config: SnaplineConfig): ScanFileDeps {
  const project = detectProject(root)
  const componentRegistry = buildComponentRegistry(
    config,
    root,
    project.tsconfigPaths,
    project.uiDir,
  )
  const tokenRegistry = buildTokenRegistry(config, project.cssVars.variables)
  return { config, componentRegistry, tokenRegistry }
}

/**
 * Scan a specific set of files (used by hooks and --changed).
 * File paths are project-root-relative.
 */
export function scanFiles(root: string, files: readonly string[], deps: ScanFileDeps): ScanResult {
  const startedAt = performance.now()
  const violations: Violation[] = []
  const allElements: JsxElementInfo[] = []
  const scannedFiles: string[] = []
  for (const file of files) {
    if (!isScannableFile(file)) continue
    const absolute = path.join(root, file)
    if (!fs.existsSync(absolute)) continue
    const sourceText = fs.readFileSync(absolute, "utf8")
    const outcome = scanFile(file, sourceText, deps)
    violations.push(...outcome.violations)
    // Reuse rate measures app code; the design system's own primitives are its
    // implementation, not drift.
    if (!isUiSourcePath(file, deps.componentRegistry.uiDir)) {
      allElements.push(...outcome.elements)
    }
    scannedFiles.push(file)
  }
  violations.push(...noDuplicateComponents(scannedFiles, deps.config, deps.componentRegistry))
  const score = computeScore(violations, countComponentReuse(allElements, deps.componentRegistry))
  return {
    root,
    scannedFiles,
    violations,
    score,
    contracts: buildRepairContracts(violations),
    durationMs: Math.round(performance.now() - startedAt),
  }
}

/** Scan every scannable file under a project root. */
export function scanProject(root: string, config: SnaplineConfig): ScanResult {
  const deps = buildScanDeps(root, config)
  return scanFiles(root, listScannableFiles(root), deps)
}

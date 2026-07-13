import fs from "node:fs"
import type { ScanResult } from "@usesnapline/contracts"
import { parseTsx } from "../scanner/parse-tsx.js"
import { registryComponent } from "../registry/component-registry.js"
import { isUiSourcePath, type ScanFileDeps } from "../scanner/scan-file.js"
import { replaceColorClassEdits } from "./codemods/replace-color-class.js"
import { replaceSimpleButtonEdits } from "./codemods/replace-simple-button.js"
import { replaceSimpleInputEdits } from "./codemods/replace-simple-input.js"
import { replaceInlineSpacingEdits } from "./codemods/replace-inline-spacing.js"
import { normalizeEdits, type FixPlan, type FileFixPlan } from "./types.js"
import { projectFilePath } from "../project/project-file.js"

/**
 * Build the safe-fix plan for files with violations. Each codemod re-parses the
 * current file content and applies its own conservative gates — the plan never
 * assumes scan-time offsets are still valid.
 */
export function createFixPlan(result: ScanResult, deps: ScanFileDeps): FixPlan {
  const files: FileFixPlan[] = []
  const filesWithViolations = [...new Set(result.violations.map((v) => v.filePath))].sort()
  for (const filePath of filesWithViolations) {
    if (isUiSourcePath(filePath, deps.componentRegistry.uiDir)) continue
    const absolute = projectFilePath(result.root, filePath)
    if (!fs.existsSync(absolute)) continue
    const sourceFile = parseTsx(filePath, fs.readFileSync(absolute, "utf8"))
    const edits = [...replaceColorClassEdits(sourceFile), ...replaceInlineSpacingEdits(sourceFile)]
    const rules = deps.config.rules
    const button = registryComponent(deps.componentRegistry, "Button")
    if (button !== undefined && rules.requireButtonComponent !== "off") {
      edits.push(...replaceSimpleButtonEdits(sourceFile, button))
    }
    const input = registryComponent(deps.componentRegistry, "Input")
    if (input !== undefined && rules.requireInputComponent !== "off") {
      edits.push(...replaceSimpleInputEdits(sourceFile, input))
    }
    const normalized = normalizeEdits(edits)
    if (normalized.length > 0) files.push({ filePath, edits: normalized })
  }
  return { files }
}

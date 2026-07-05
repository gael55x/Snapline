// Config
export {
  loadConfig,
  parseConfig,
  defaultConfig,
  ConfigError,
  CONFIG_FILE_NAME,
  DEFAULT_ALLOWED_COLOR_CLASSES,
} from "./config.js"

// Project detection
export { detectProject, type ProjectInfo } from "./project/detect-project.js"
export { readComponentsJson, type ComponentsJson } from "./project/read-components-json.js"
export { readTsconfigPaths, resolveAlias } from "./project/read-tsconfig-paths.js"
export { readTailwindConfig, type TailwindInfo } from "./project/read-tailwind-config.js"
export { readCssVars, type CssVarsInfo } from "./project/read-css-vars.js"

// Registries
export { buildComponentRegistry, registryComponent } from "./registry/component-registry.js"
export { buildTokenRegistry, isAllowedColorClass } from "./registry/token-registry.js"
export { buildImportRegistry } from "./registry/import-registry.js"

// Scanner
export { parseTsx } from "./scanner/parse-tsx.js"
export { extractClassNames, type ExtractedClass } from "./scanner/extract-classnames.js"
export { extractJsxElements, type JsxElementInfo } from "./scanner/extract-jsx-elements.js"
export { extractInlineStyles, type InlineStyleInfo } from "./scanner/extract-inline-styles.js"
export { extractImports, type ImportInfo } from "./scanner/extract-imports.js"
export {
  scanFile,
  isUiSourcePath,
  type ScanFileDeps,
  type FileScanOutcome,
} from "./scanner/scan-file.js"
export {
  scanProject,
  scanFiles,
  buildScanDeps,
  listScannableFiles,
  isScannableFile,
} from "./scanner/scan-project.js"
export {
  stripVariants,
  isArbitraryValue,
  isRawPaletteClass,
  suggestScaleClass,
} from "./scanner/tailwind-classes.js"

// Rules
export { FILE_RULES, noDuplicateComponents, severityFor } from "./rules/index.js"
export type { FileScanContext, FileRule, RuleViolationDraft } from "./rules/context.js"

// Scorer
export { computeScore, type ReuseCounts } from "./scorer/drift-score.js"
export { countComponentReuse } from "./scorer/component-reuse-rate.js"

// Reports
export {
  buildRepairContracts,
  formatAgentMessage,
  combineAgentMessages,
} from "./report/agent-report.js"
export { humanReport, scoreReport } from "./report/human-report.js"
export { jsonReport } from "./report/json-report.js"

// Hook policy
export { decideFromScan } from "./hook/decide.js"
export { runHook, gitChangedFiles } from "./hook/run-hook.js"

// Fixer
export { createFixPlan } from "./fixer/create-fix-plan.js"
export { applySafeFixes, type AppliedFix } from "./fixer/apply-safe-fixes.js"
export type { FixPlan, FileFixPlan, TextEdit } from "./fixer/types.js"

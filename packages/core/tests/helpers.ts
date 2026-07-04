import type { ComponentRegistry, SnaplineConfig } from "@usesnapline/contracts"
import { defaultConfig } from "../src/config.js"
import { buildTokenRegistry } from "../src/registry/token-registry.js"
import { scanFile, type ScanFileDeps } from "../src/scanner/scan-file.js"

/** Registry where every default component exists — the common shadcn project case. */
export function fakeRegistry(overrides?: Partial<ComponentRegistry>): ComponentRegistry {
  return {
    components: [
      {
        name: "Button",
        importPath: "@/components/ui/button",
        preferOver: ["button"],
        fileExists: true,
      },
      {
        name: "Input",
        importPath: "@/components/ui/input",
        preferOver: ["input"],
        fileExists: true,
      },
      {
        name: "Dialog",
        importPath: "@/components/ui/dialog",
        preferOver: ['div[role="dialog"]'],
        fileExists: true,
      },
      {
        name: "Card",
        importPath: "@/components/ui/card",
        preferOver: ["div[data-card]"],
        fileExists: true,
      },
    ],
    uiDir: "src/components/ui",
    ...overrides,
  }
}

export function testDeps(config: SnaplineConfig = defaultConfig()): ScanFileDeps {
  return {
    config,
    componentRegistry: fakeRegistry(),
    tokenRegistry: buildTokenRegistry(config),
  }
}

export function scan(source: string, filePath = "src/app/page.tsx") {
  return scanFile(filePath, source, testDeps())
}

export function violationsOf(source: string, filePath = "src/app/page.tsx") {
  return scan(source, filePath).violations
}

export function rulesHit(source: string, filePath = "src/app/page.tsx"): string[] {
  return [...new Set(violationsOf(source, filePath).map((v) => v.ruleId))].sort()
}

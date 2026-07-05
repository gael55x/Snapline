import { describe, expect, it } from "vitest"
import { parseConfig, defaultConfig, ConfigError } from "../src/config.js"

describe("config parsing", () => {
  it("parses the default snapline.yml shape", () => {
    const config = parseConfig(`
version: 1
stack:
  framework: next
  ui: shadcn
  styling: tailwind
components:
  Button:
    import: "@/components/ui/button"
    preferOver:
      - button
tokens:
  colors:
    semanticOnly: true
    allowed:
      - bg-background
      - bg-primary
rules:
  noRawHex: error
  noRawPaletteColor: warn
fix:
  safeAutofix: false
  preferAgentRepair: true
benchmark:
  enabled: true
  scorer: ui-drift-score-v1
`)
    expect(config.version).toBe(1)
    expect(config.components.Button?.import).toBe("@/components/ui/button")
    expect(config.tokens.colors.allowed).toEqual(["bg-background", "bg-primary"])
    expect(config.rules.noRawHex).toBe("error")
    expect(config.rules.noInlineStyle).toBe("error") // default preserved
  })

  it("rejects unknown top-level keys, unknown rules, bad severities, bad versions", () => {
    expect(() => parseConfig("version: 2")).toThrow(ConfigError)
    expect(() => parseConfig("version: 1\nbogus: true")).toThrow(ConfigError)
    expect(() => parseConfig("version: 1\nrules:\n  nope: error")).toThrow(ConfigError)
    expect(() => parseConfig("version: 1\nrules:\n  noRawHex: fatal")).toThrow(ConfigError)
  })

  it("defaults are complete", () => {
    const config = defaultConfig()
    expect(Object.keys(config.rules)).toHaveLength(9)
    expect(config.tokens.colors.semanticOnly).toBe(true)
    expect(config.fix.safeAutofix).toBe(false)
  })
})

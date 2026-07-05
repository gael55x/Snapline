import { describe, expect, it } from "vitest"
import { defaultConfig } from "../../src/config.js"
import { noDuplicateComponents } from "../../src/rules/no-duplicate-components.js"
import { fakeRegistry, rulesHit, violationsOf } from "../helpers.js"

describe("no-raw-hex", () => {
  it("catches hex in arbitrary classes", () => {
    expect(rulesHit(`export const A = () => <p className="text-[#6366f1]">hi</p>`)).toContain(
      "no-raw-hex",
    )
    expect(rulesHit(`export const A = () => <div className="bg-[#111827]" />`)).toContain(
      "no-raw-hex",
    )
  })
  it("catches hex in inline styles", () => {
    const violations = violationsOf(`export const A = () => <p style={{ color: "#6366f1" }}>hi</p>`)
    expect(violations.map((v) => v.ruleId)).toContain("no-raw-hex")
  })
  it("ignores semantic classes", () => {
    expect(rulesHit(`export const A = () => <p className="text-primary">hi</p>`)).toEqual([])
  })
})

describe("no-inline-style", () => {
  it("catches style objects and suggests exact scale classes", () => {
    const violations = violationsOf(
      `export const A = () => <div style={{ marginTop: "12px", paddingLeft: "16px" }} />`,
    )
    const v = violations.find((v) => v.ruleId === "no-inline-style")
    expect(v).toBeDefined()
    expect(v?.repair.instruction).toContain("mt-3")
    expect(v?.repair.instruction).toContain("pl-4")
    expect(v?.repair.safeFix).toBe(true)
  })
  it("marks unsafe when values are off-scale", () => {
    const violations = violationsOf(`export const A = () => <div style={{ marginTop: "13px" }} />`)
    const v = violations.find((v) => v.ruleId === "no-inline-style")
    expect(v?.repair.safeFix).toBe(false)
  })
  it("ignores style variable references", () => {
    expect(rulesHit(`export const A = ({s}: {s: object}) => <div style={s} />`)).toEqual([])
  })
})

describe("no-arbitrary-tailwind", () => {
  it("catches arbitrary spacing/sizing/font values", () => {
    for (const cls of ["mt-[13px]", "w-[472px]", "text-[14px]", "rounded-[11px]"]) {
      expect(rulesHit(`export const A = () => <div className="${cls}" />`)).toContain(
        "no-arbitrary-tailwind",
      )
    }
  })
  it("suggests the nearest scale value", () => {
    const violations = violationsOf(`export const A = () => <div className="mt-[13px]" />`)
    const v = violations.find((v) => v.ruleId === "no-arbitrary-tailwind")
    expect(v?.repair.instruction).toContain("mt-3")
  })
  it("gives text-[14px] an exact safe fix", () => {
    const violations = violationsOf(`export const A = () => <p className="text-[14px]">x</p>`)
    const v = violations.find((v) => v.ruleId === "no-arbitrary-tailwind")
    expect(v?.repair.replacement).toBe("text-sm")
    expect(v?.repair.safeFix).toBe(true)
  })
  it("does not double-count hex classes", () => {
    const violations = violationsOf(`export const A = () => <div className="bg-[#111827]" />`)
    expect(violations.filter((v) => v.ruleId === "no-arbitrary-tailwind")).toHaveLength(0)
  })
  it("handles variant prefixes", () => {
    expect(rulesHit(`export const A = () => <div className="md:hover:mt-[13px]" />`)).toContain(
      "no-arbitrary-tailwind",
    )
  })
})

describe("no-raw-palette-color", () => {
  it("catches palette classes", () => {
    for (const cls of ["bg-blue-500", "text-gray-500", "border-zinc-200", "ring-indigo-400"]) {
      expect(rulesHit(`export const A = () => <div className="${cls}" />`)).toContain(
        "no-raw-palette-color",
      )
    }
  })
  it("maps common classes to semantic tokens with safe fixes", () => {
    const violations = violationsOf(`export const A = () => <div className="bg-blue-500" />`)
    const v = violations.find((v) => v.ruleId === "no-raw-palette-color")
    expect(v?.repair.replacement).toBe("bg-primary")
    expect(v?.repair.safeFix).toBe(true)
  })
  it("catches bg-white with an advisory (no safe fix)", () => {
    const violations = violationsOf(`export const A = () => <div className="bg-white" />`)
    const v = violations.find((v) => v.ruleId === "no-raw-palette-color")
    expect(v).toBeDefined()
    expect(v?.repair.safeFix).toBe(false)
  })
  it("respects the allowed token list and variants", () => {
    expect(rulesHit(`export const A = () => <div className="hover:bg-primary/90" />`)).toEqual([])
  })
})

describe("require-button-component / require-input-component", () => {
  it("flags raw button and input in app code", () => {
    const hits = rulesHit(`export const A = () => <><button>Go</button><input /></>`)
    expect(hits).toContain("require-button-component")
    expect(hits).toContain("require-input-component")
  })
  it("skips the design-system's own source", () => {
    const hits = rulesHit(
      `export const Button = () => <button>Go</button>`,
      "src/components/ui/button.tsx",
    )
    expect(hits).toEqual([])
  })
  it("skips hidden/checkbox/radio inputs", () => {
    for (const type of ["hidden", "checkbox", "radio"]) {
      expect(rulesHit(`export const A = () => <input type="${type}" />`)).toEqual([])
    }
  })
})

describe("require-dialog-component", () => {
  it("flags role=dialog and fixed inset-0 overlays", () => {
    expect(rulesHit(`export const A = () => <div role="dialog">x</div>`)).toContain(
      "require-dialog-component",
    )
    expect(
      rulesHit(`export const A = () => <div className="fixed inset-0 z-50 bg-background/80" />`),
    ).toContain("require-dialog-component")
  })
  it("does not flag ordinary fixed elements", () => {
    expect(rulesHit(`export const A = () => <div className="fixed top-0" />`)).toEqual([])
  })
})

describe("require-card-component", () => {
  it("flags repeated card-like containers only", () => {
    const one = `export const A = () => <div className="rounded-lg border bg-card p-4" />`
    expect(rulesHit(one)).toEqual([])
    const two = `export const A = () => <>
      <div className="rounded-lg border bg-card p-4" />
      <div className="rounded-xl border bg-card p-6" />
    </>`
    expect(rulesHit(two)).toContain("require-card-component")
  })
})

describe("no-duplicate-components", () => {
  it("flags duplicate component files when the system component exists", () => {
    const violations = noDuplicateComponents(
      ["src/components/CustomButton.tsx", "src/components/BaseModal.tsx", "src/app/page.tsx"],
      defaultConfig(),
      fakeRegistry(),
    )
    expect(violations.map((v) => v.filePath).sort()).toEqual([
      "src/components/BaseModal.tsx",
      "src/components/CustomButton.tsx",
    ])
  })
  it("does not flag compositions like IconButton or the ui dir itself", () => {
    const violations = noDuplicateComponents(
      ["src/components/IconButton.tsx", "src/components/ui/button.tsx"],
      defaultConfig(),
      fakeRegistry(),
    )
    expect(violations).toEqual([])
  })
})

describe("severity configuration", () => {
  it("off disables a rule; error escalates it", async () => {
    const { scanFile } = await import("../../src/scanner/scan-file.js")
    const { testDeps } = await import("../helpers.js")
    const base = defaultConfig()
    const source = `export const A = () => <div className="bg-blue-500" />`

    const offDeps = testDeps({ ...base, rules: { ...base.rules, noRawPaletteColor: "off" } })
    expect(scanFile("src/a.tsx", source, offDeps).violations).toEqual([])

    const errorDeps = testDeps({ ...base, rules: { ...base.rules, noRawPaletteColor: "error" } })
    const violations = scanFile("src/a.tsx", source, errorDeps).violations
    expect(violations[0]?.severity).toBe("error")
  })
})

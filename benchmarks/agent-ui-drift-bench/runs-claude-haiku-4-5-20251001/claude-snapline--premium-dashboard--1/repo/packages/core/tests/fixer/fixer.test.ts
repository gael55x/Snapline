import type ts from "typescript"
import { describe, expect, it } from "vitest"
import { parseTsx } from "../../src/scanner/parse-tsx.js"
import { applyEdits } from "../../src/fixer/types.js"
import { replaceColorClassEdits } from "../../src/fixer/codemods/replace-color-class.js"
import { replaceSimpleButtonEdits } from "../../src/fixer/codemods/replace-simple-button.js"
import { replaceSimpleInputEdits } from "../../src/fixer/codemods/replace-simple-input.js"
import { replaceInlineSpacingEdits } from "../../src/fixer/codemods/replace-inline-spacing.js"

const BUTTON = {
  name: "Button",
  importPath: "@/components/ui/button",
  preferOver: ["button"],
  fileExists: true,
} as const
const INPUT = {
  name: "Input",
  importPath: "@/components/ui/input",
  preferOver: ["input"],
  fileExists: true,
} as const

function fix(
  source: string,
  edits: (
    sf: ts.SourceFile,
  ) => { start: number; end: number; newText: string; description: string }[],
): string {
  const sf = parseTsx("a.tsx", source)
  return applyEdits(source, edits(sf))
}

describe("replace-color-class", () => {
  it("maps unambiguous palette classes, preserving variants", () => {
    const out = fix(
      `const A = () => <div className="bg-blue-500 hover:bg-blue-600 text-gray-500 border-zinc-200" />`,
      replaceColorClassEdits,
    )
    expect(out).toContain("bg-primary")
    expect(out).toContain("hover:bg-primary")
    expect(out).toContain("text-muted-foreground")
    expect(out).toContain("border-border")
  })
  it("leaves ambiguous classes alone", () => {
    const source = `const A = () => <div className="bg-white bg-amber-300" />`
    expect(fix(source, replaceColorClassEdits)).toBe(source)
  })
})

describe("replace-simple-button", () => {
  it("swaps simple buttons and adds the import", () => {
    const out = fix(
      `import React from "react"\nconst A = () => <button type="button" onClick={() => {}}>Go</button>`,
      (sf) => replaceSimpleButtonEdits(sf, BUTTON),
    )
    expect(out).toContain(`import { Button } from "@/components/ui/button"`)
    expect(out).toContain("<Button type=")
    expect(out).toContain("</Button>")
  })
  it("refuses spreads and unknown attributes", () => {
    for (const source of [
      `const A = (p: object) => <button {...p}>Go</button>`,
      `const A = () => <button form="f">Go</button>`,
    ]) {
      expect(fix(source, (sf) => replaceSimpleButtonEdits(sf, BUTTON))).toBe(source)
    }
  })
  it("does not duplicate an existing import", () => {
    const out = fix(
      `import { Button } from "@/components/ui/button"\nconst A = () => <><Button>x</Button><button>Go</button></>`,
      (sf) => replaceSimpleButtonEdits(sf, BUTTON),
    )
    expect(out.match(/import \{ Button \}/g)).toHaveLength(1)
  })
})

describe("replace-simple-input", () => {
  it("swaps simple self-closing inputs", () => {
    const out = fix(`const A = () => <input placeholder="Email" type="email" />`, (sf) =>
      replaceSimpleInputEdits(sf, INPUT),
    )
    expect(out).toContain("<Input placeholder=")
  })
})

describe("replace-inline-spacing", () => {
  it("converts fully-mappable style objects into className", () => {
    const out = fix(
      `const A = () => <div style={{ marginTop: "12px" }} />`,
      replaceInlineSpacingEdits,
    )
    expect(out).toContain(`className="mt-3"`)
    expect(out).not.toContain("style=")
  })
  it("appends to an existing static className", () => {
    const out = fix(
      `const A = () => <div className="flex" style={{ paddingLeft: "16px" }} />`,
      replaceInlineSpacingEdits,
    )
    expect(out).toContain(`className="flex pl-4"`)
  })
  it("refuses off-scale values, colors, and dynamic classNames", () => {
    for (const source of [
      `const A = () => <div style={{ marginTop: "13px" }} />`,
      `const A = () => <div style={{ color: "#fff" }} />`,
      `const A = ({c}:{c:string}) => <div className={c} style={{ marginTop: "12px" }} />`,
    ]) {
      expect(fix(source, replaceInlineSpacingEdits)).toBe(source)
    }
  })
})

import { describe, expect, it } from "vitest"
import { parseTsx } from "../../src/scanner/parse-tsx.js"
import { extractClassNames } from "../../src/scanner/extract-classnames.js"
import { extractJsxElements } from "../../src/scanner/extract-jsx-elements.js"
import { extractInlineStyles } from "../../src/scanner/extract-inline-styles.js"
import { extractImports } from "../../src/scanner/extract-imports.js"
import { stripVariants, suggestScaleClass } from "../../src/scanner/tailwind-classes.js"

describe("parseTsx", () => {
  it("reports invalid syntax with a source location", () => {
    expect(() => parseTsx("src/broken.tsx", "const Broken = () => <div>")).toThrow(
      "src/broken.tsx:1:23: JSX element 'div' has no corresponding closing tag.",
    )
  })
})

describe("extractClassNames", () => {
  it("reads plain string className", () => {
    const sf = parseTsx("a.tsx", `const A = () => <div className="mt-4 bg-primary" />`)
    expect(extractClassNames(sf).map((c) => c.value)).toEqual(["mt-4", "bg-primary"])
  })
  it("reads cn() helper arguments and conditionals", () => {
    const sf = parseTsx(
      "a.tsx",
      `const A = ({x}:{x:boolean}) => <div className={cn("base", x && "bg-blue-500", x ? "p-2" : "p-4")} />`,
    )
    expect(extractClassNames(sf).map((c) => c.value)).toEqual(["base", "bg-blue-500", "p-2", "p-4"])
  })
  it("reads clsx/cn object keys and array elements", () => {
    const sf = parseTsx(
      "a.tsx",
      `const A = ({on}:{on:boolean}) => <div className={cn({ "mt-[13px] bg-blue-500": on, flex: on }, ["p-2", on && "text-white"])} />`,
    )
    expect(extractClassNames(sf).map((c) => c.value)).toEqual([
      "mt-[13px]",
      "bg-blue-500",
      "flex",
      "p-2",
      "text-white",
    ])
  })

  it("reads static template chunks and skips dynamic parts", () => {
    const sf = parseTsx(
      "a.tsx",
      "const A = ({v}:{v:string}) => <div className={`mt-2 ${v} px-3`} />",
    )
    expect(extractClassNames(sf).map((c) => c.value)).toEqual(["mt-2", "px-3"])
  })
  it("records accurate positions", () => {
    const sf = parseTsx("a.tsx", `const A = () => <div className="mt-4 bg-blue-500" />`)
    const cls = extractClassNames(sf).find((c) => c.value === "bg-blue-500")
    expect(cls?.line).toBe(1)
    expect(sf.text.slice(cls?.start, cls?.end)).toBe("bg-blue-500")
  })
})

describe("extractJsxElements", () => {
  it("captures tags, static attributes, and spread detection", () => {
    const sf = parseTsx(
      "a.tsx",
      `const A = (p: object) => <button type="button" {...p} className="x">Go</button>`,
    )
    const [el] = extractJsxElements(sf)
    expect(el?.tagName).toBe("button")
    expect(el?.attributes.type).toBe("button")
    expect(el?.hasSpreadAttribute).toBe(true)
  })
})

describe("extractInlineStyles", () => {
  it("captures static object literals", () => {
    const sf = parseTsx("a.tsx", `const A = () => <div style={{ marginTop: "13px", zIndex: 2 }} />`)
    const [style] = extractInlineStyles(sf)
    expect(style?.properties).toEqual([
      { name: "marginTop", value: "13px" },
      { name: "zIndex", value: "2" },
    ])
    expect(style?.fullyStatic).toBe(true)
  })
  it("ignores non-object style expressions", () => {
    const sf = parseTsx("a.tsx", `const A = ({s}:{s:object}) => <div style={s} />`)
    expect(extractInlineStyles(sf)).toEqual([])
  })
})

describe("extractImports", () => {
  it("captures named and default imports", () => {
    const sf = parseTsx(
      "a.tsx",
      `import React from "react"\nimport { Button, buttonVariants } from "@/components/ui/button"`,
    )
    expect(extractImports(sf)).toMatchObject([
      { source: "react", names: ["React"] },
      { source: "@/components/ui/button", names: ["Button", "buttonVariants"] },
    ])
  })
})

describe("tailwind class helpers", () => {
  it("strips variants but not bracket-internal colons", () => {
    expect(stripVariants("dark:hover:bg-primary")).toBe("bg-primary")
    expect(stripVariants("bg-[color:var(--x)]")).toBe("bg-[color:var(--x)]")
    expect(stripVariants("md:bg-[color:var(--x)]")).toBe("bg-[color:var(--x)]")
  })
  it("suggests scale classes", () => {
    expect(suggestScaleClass("mt-[13px]")).toMatchObject({ cls: "mt-3", exact: false })
    expect(suggestScaleClass("mt-[12px]")).toMatchObject({ cls: "mt-3", exact: true })
    expect(suggestScaleClass("text-[14px]")).toMatchObject({ cls: "text-sm", exact: true })
    expect(suggestScaleClass("rounded-[11px]")).toMatchObject({ cls: "rounded-xl", exact: false })
    expect(suggestScaleClass("w-[472px]")).toBeDefined()
  })
})

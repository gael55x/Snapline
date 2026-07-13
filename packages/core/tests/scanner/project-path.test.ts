import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { applySafeFixes } from "../../src/fixer/apply-safe-fixes.js"
import { scanFiles } from "../../src/scanner/scan-project.js"
import { testDeps } from "../helpers.js"

const roots: string[] = []

function temporaryRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "snapline-root-"))
  roots.push(root)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
})

describe("project file containment", () => {
  it("rejects traversal before scanning", () => {
    const root = temporaryRoot()
    const outside = path.join(path.dirname(root), "outside.tsx")
    fs.writeFileSync(outside, "export const Outside = () => <button>Outside</button>")
    roots.push(outside)
    expect(() => scanFiles(root, ["../outside.tsx"], testDeps())).toThrow(
      "File path escapes the project root",
    )
  })

  it("rejects external symlink targets before scanning or fixing", () => {
    const root = temporaryRoot()
    const outside = path.join(path.dirname(root), "outside-target.tsx")
    const source = 'export const Outside = () => <div className="text-gray-500" />'
    fs.writeFileSync(outside, source)
    roots.push(outside)
    fs.symlinkSync(outside, path.join(root, "outside-link.tsx"))

    expect(() => scanFiles(root, ["outside-link.tsx"], testDeps())).toThrow(
      "File resolves outside the project root",
    )
    expect(() =>
      applySafeFixes(root, {
        files: [
          {
            filePath: "outside-link.tsx",
            edits: [{ start: 0, end: 6, newText: "changed", description: "test" }],
          },
        ],
      }),
    ).toThrow("File resolves outside the project root")
    expect(fs.readFileSync(outside, "utf8")).toBe(source)
  })

  it("sorts and deduplicates explicit file inputs", () => {
    const root = temporaryRoot()
    fs.writeFileSync(path.join(root, "b.tsx"), "export const B = () => <div />")
    fs.writeFileSync(path.join(root, "a.tsx"), "export const A = () => <div />")
    expect(scanFiles(root, ["b.tsx", "a.tsx", "b.tsx"], testDeps()).scannedFiles).toEqual([
      "a.tsx",
      "b.tsx",
    ])
  })
})

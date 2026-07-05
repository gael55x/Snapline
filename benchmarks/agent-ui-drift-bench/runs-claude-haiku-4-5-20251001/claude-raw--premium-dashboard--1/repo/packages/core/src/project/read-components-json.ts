import fs from "node:fs"
import path from "node:path"

export interface ComponentsJson {
  readonly style?: string
  readonly aliases?: Readonly<Record<string, string>>
  readonly tailwind?: { readonly config?: string; readonly css?: string }
}

/** Read shadcn's components.json when present. Returns undefined when missing or unparsable. */
export function readComponentsJson(root: string): ComponentsJson | undefined {
  const file = path.join(root, "components.json")
  if (!fs.existsSync(file)) return undefined
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"))
    if (typeof parsed !== "object" || parsed === null) return undefined
    return parsed as ComponentsJson
  } catch {
    return undefined
  }
}

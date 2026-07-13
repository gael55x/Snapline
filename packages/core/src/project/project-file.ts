import fs from "node:fs"
import path from "node:path"

export class ProjectPathError extends Error {}

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate)
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  )
}

/** Resolve a root-relative file and reject traversal or an external symlink target. */
export function projectFilePath(root: string, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    throw new ProjectPathError(`File path must be project-relative: ${filePath}`)
  }
  const rootAbsolute = path.resolve(root)
  const absolute = path.resolve(rootAbsolute, filePath)
  if (!isInside(rootAbsolute, absolute)) {
    throw new ProjectPathError(`File path escapes the project root: ${filePath}`)
  }
  if (!fs.existsSync(absolute)) return absolute
  const rootReal = fs.realpathSync(rootAbsolute)
  const fileReal = fs.realpathSync(absolute)
  if (!isInside(rootReal, fileReal)) {
    throw new ProjectPathError(`File resolves outside the project root: ${filePath}`)
  }
  return absolute
}

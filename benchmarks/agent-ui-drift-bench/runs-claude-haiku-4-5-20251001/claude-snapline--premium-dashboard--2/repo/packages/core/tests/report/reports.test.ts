import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { scanFile } from "../../src/scanner/scan-file.js"
import { buildRepairContracts, combineAgentMessages } from "../../src/report/agent-report.js"
import { testDeps } from "../helpers.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const sample = (name: string) => fs.readFileSync(path.join(here, "..", "samples", name), "utf8")

describe("repair contracts", () => {
  it("produces one contract per file with required/optional actions split by severity", () => {
    const outcome = scanFile(
      "src/app/settings/billing/page.tsx",
      sample("dirty-billing-page.tsx"),
      testDeps(),
    )
    const contracts = buildRepairContracts(outcome.violations)
    expect(contracts).toHaveLength(1)
    const contract = contracts[0]
    expect(contract?.filePath).toBe("src/app/settings/billing/page.tsx")
    expect(contract?.requiredActions.length).toBeGreaterThan(0)
    expect(contract?.optionalActions.length).toBeGreaterThan(0)
    expect(contract?.safeFixAvailable).toBe(true)
    expect(contract?.agentMessage).toContain("SNAPLINE FOUND UI DRIFT")
  })

  it("golden snapshot: agent message for the dirty billing page", () => {
    const outcome = scanFile(
      "src/app/settings/billing/page.tsx",
      sample("dirty-billing-page.tsx"),
      testDeps(),
    )
    const message = combineAgentMessages(buildRepairContracts(outcome.violations))
    expect(message).toMatchSnapshot()
  })

  it("every violation carries rule id, severity, evidence, and an exact instruction", () => {
    const outcome = scanFile("src/x.tsx", sample("dirty-billing-page.tsx"), testDeps())
    for (const violation of outcome.violations) {
      expect(violation.ruleId).toBeTruthy()
      expect(["error", "warn"]).toContain(violation.severity)
      expect(violation.evidence).toBeTruthy()
      expect(violation.repair.instruction.length).toBeGreaterThan(20)
      expect(typeof violation.repair.safeFix).toBe("boolean")
    }
  })
})

#!/bin/bash
# Reduced public matrix worker: MODES × PROMPTS × ATTEMPTS, sequential.
# Usage: ./run-matrix.sh "mode1 mode2" [logfile]
# Prompt subset (fixed for the reduced matrix): 5 polish drift-traps + 5 build/modal/table.
set -u
cd "$(dirname "$0")/../.."

MODES="${1:?usage: run-matrix.sh \"mode1 mode2...\" [logfile]}"
LOG="${2:-/tmp/snapline-matrix.log}"
PROMPTS="premium-dashboard polished-settings-page pricing-cards-polish onboarding-cleanup dashboard-visual-hierarchy billing-settings-page login-page team-invite-modal invoices-table empty-state"
ATTEMPTS="1 2 3"

echo "[matrix] start $(date '+%F %T') modes=[$MODES]" >> "$LOG"
total=0; failed=0
for mode in $MODES; do
  for prompt in $PROMPTS; do
    for attempt in $ATTEMPTS; do
      id="$mode--$prompt--$attempt"
      if [ -f "benchmarks/agent-ui-drift-bench/runs/$id/run.json" ]; then
        echo "[matrix] skip $id (exists)" >> "$LOG"
        continue
      fi
      echo "[matrix] run $id $(date '+%T')" >> "$LOG"
      if ! pnpm bench:agent -- --mode "$mode" --prompt "$prompt" --attempt "$attempt" >> "$LOG" 2>&1; then
        echo "[matrix] RUNNER-ERROR $id" >> "$LOG"
        failed=$((failed+1))
      fi
      total=$((total+1))
    done
  done
done
echo "[matrix] done $(date '+%F %T') ran=$total runner-errors=$failed modes=[$MODES]" >> "$LOG"

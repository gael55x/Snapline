#!/bin/bash
# Reduced public matrix worker: MODES × PROMPTS × ATTEMPTS, sequential.
# Usage: ./run-matrix.sh "mode1 mode2" [logfile]
# Prompt subset (fixed for the reduced matrix): 5 polish drift-traps + 5 build/modal/table.
#
# Speed: cells copy a pristine installed+built template checkout (APFS
# copy-on-write) instead of clone+install+build. The template is created once
# from current HEAD; its SHA is recorded per run. Byte-identical isolation.
set -u
cd "$(dirname "$0")/../.."
REPO="$PWD"
BENCH="$REPO/benchmarks/agent-ui-drift-bench"

MODES="${1:?usage: run-matrix.sh \"mode1 mode2...\" [logfile]}"
LOG="${2:-/tmp/snapline-matrix.log}"
# MODEL env overrides benchmark.config.json model; cells land in runs-<model>/.
# AGENT env segregates non-Claude slices, e.g. AGENT=codex -> runs-codex/.
MODEL="${MODEL:-}"
AGENT="${AGENT:-}"
MODEL_ARGS=""
RUNS_SUBDIR="runs"
safe_segment() {
  printf "%s" "$1" | tr -c 'a-zA-Z0-9.-' '-'
}
RUNS_SUFFIX=""
if [ -n "$AGENT" ] && [ "$AGENT" != "claude" ]; then
  RUNS_SUFFIX="$(safe_segment "$AGENT")"
fi
if [ -n "$MODEL" ]; then
  MODEL_ARGS="--model $MODEL"
  MODEL_SEGMENT="$(safe_segment "$MODEL")"
  if [ -n "$RUNS_SUFFIX" ]; then
    RUNS_SUFFIX="$RUNS_SUFFIX-$MODEL_SEGMENT"
  else
    RUNS_SUFFIX="$MODEL_SEGMENT"
  fi
fi
if [ -n "$RUNS_SUFFIX" ]; then
  RUNS_SUBDIR="runs-$RUNS_SUFFIX"
fi
PROMPTS="premium-dashboard polished-settings-page pricing-cards-polish onboarding-cleanup dashboard-visual-hierarchy billing-settings-page login-page team-invite-modal invoices-table empty-state"
ATTEMPTS="1 2 3"

TEMPLATE="$BENCH/$RUNS_SUBDIR/_template"
LOCK="$BENCH/$RUNS_SUBDIR/_template.lock"
mkdir -p "$BENCH/$RUNS_SUBDIR"
if [ ! -f "$TEMPLATE/.ready" ]; then
  if mkdir "$LOCK" 2>/dev/null; then
    echo "[matrix] building template from $(git rev-parse --short HEAD)" >> "$LOG"
    rm -rf "$TEMPLATE"
    git clone --quiet "$REPO" "$TEMPLATE" &&
      (cd "$TEMPLATE" && pnpm install --frozen-lockfile --prefer-offline > /dev/null 2>&1 && pnpm build > /dev/null 2>&1) &&
      touch "$TEMPLATE/.ready"
    rmdir "$LOCK"
  else
    echo "[matrix] waiting for template build" >> "$LOG"
    while [ ! -f "$TEMPLATE/.ready" ]; do sleep 5; done
  fi
fi
export SNAPLINE_BENCH_TEMPLATE="$TEMPLATE"

echo "[matrix] start $(date '+%F %T') agent=[$AGENT] modes=[$MODES] template=$(cd "$TEMPLATE" && git rev-parse --short HEAD)" >> "$LOG"
total=0; failed=0
for mode in $MODES; do
  for prompt in $PROMPTS; do
    for attempt in $ATTEMPTS; do
      id="$mode--$prompt--$attempt"
      if [ -f "$BENCH/$RUNS_SUBDIR/$id/run.json" ]; then
        echo "[matrix] skip $id (exists)" >> "$LOG"
        continue
      fi
      echo "[matrix] run $id $(date '+%T')" >> "$LOG"
      if ! pnpm bench:agent -- --mode "$mode" --prompt "$prompt" --attempt "$attempt" $MODEL_ARGS >> "$LOG" 2>&1; then
        echo "[matrix] RUNNER-ERROR $id" >> "$LOG"
        failed=$((failed+1))
      fi
      total=$((total+1))
    done
  done
done
echo "[matrix] done $(date '+%F %T') ran=$total runner-errors=$failed modes=[$MODES]" >> "$LOG"

#!/bin/sh
# P3: kaizen reads cut estimates from the log; the cost baseline reads cumulative across specs.
grep -n "estimatesOf\|parseCutEstimates\|session-cuts" src/scripts/session-turns.ts src/cli/run-close.ts
grep -n "cumulative\|allEntries" src/cli/run-cost.ts | head -20

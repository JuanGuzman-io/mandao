#!/bin/sh
# P1: every Claude Code cost record of a spec names its session and the time it was recorded.
for f in specs/*/_log/costs.yml; do
  echo "$f: $(grep -c '^  - at:' "$f") records, $(grep -c '^    session:' "$f") with session; commands: $(grep '^    command:' "$f" | sed 's/.*: //' | tr '\n' ' ')"
done

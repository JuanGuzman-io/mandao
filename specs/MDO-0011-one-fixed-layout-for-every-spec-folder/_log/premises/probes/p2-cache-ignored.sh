#!/bin/sh
# P2: .mandao/cache is neither tracked nor ignored today; the task commit stages the whole spec folder.
echo "tracked under .mandao/cache: $(git ls-files .mandao/cache | wc -l | tr -d ' ')"
git check-ignore -v .mandao/cache/x || echo "not ignored"
grep -n "git.*add" src/scripts/commits.ts

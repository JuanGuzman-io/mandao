#!/bin/sh
# P1: which src files name the per-attempt log files (packs, reviews, gates, mutations, full-runs, discrepancies) or the close docs folders.
echo "== pack / review / gates / mutations / full-runs / discrepancies =="
grep -rn -E "'(reviews|gates|mutations)'|-pack\.md|-review\.md|full-runs|discrepancies" src --include=*.ts | grep -v '^src/schemas' 
echo "== docs/releases, docs/kaizen, paths.releases =="
grep -rn -E "docs/kaizen|paths\.releases" src --include=*.ts

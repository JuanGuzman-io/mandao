---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
---

# Quickstart — Measure what the session-cut rule needs

**Before you start:** this branch built (`npm run build`) and a spec whose commands ran in Claude Code
with recorded costs (MDO-0007, or MDO-0008 after its close).

1. `node dist/cli.js doctor`
   You should see: an info line with the main and subagent cache TTL, where each comes from (or
   "unset, default …"), and the hint that ADR 0036 recommends `promptCacheTtl: 5m`.
2. Add `"promptCacheTtl": "10m"` to `.claude/settings.local.json`, run `doctor` again, then remove it.
   You should see: a warning naming that file and "not 5m or 1h"; the file is otherwise untouched.
3. `node dist/cli.js run kaizen MDO-0007`
   You should see: `sessions` with the pauses (count, median, ≤5m / 5–60m / >60m) and the main turns
   for T1, T2, verify and close.
4. `node dist/cli.js run kaizen-compare`
   You should see: `sessionCut` with each constant next to its measured value and `n`, and
   "insufficient data (minimum 3)" while fewer than 3 specs have sessions.

**Expected result:** the cache duration in use and the real pauses and turns are visible without
reading transcripts by hand, and no setting or constant changed.

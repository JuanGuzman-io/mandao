---
schema_version: 1
spec: <ID>-<slug>
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
---

# Tasks — <title>

<!--
One heading per task with a status checkbox, then a YAML block (ADR 0015). Order by dependencies;
multi-project: contract → back and front in parallel against a mock → integration → e2e.
Tests follow rules/test-policy.md; tier: fast | standard | strong; risk_tags from rules/review.md.
-->

### [ ] T1 — <name>

```yaml
project: <project>
tier: standard
files: [path/to/file.ts]
exemplar: path/to/similar.ts
risk_tags: []
ac: [AC-1, AC-1/C1]
scenarios: [S-1.1, S-1.1/C1]
tests: { unit: [what the unit test proves], e2e: [] }
dod: [module AGENTS.md (and CLAUDE.md pointer) created or updated]
verify: <command>
depends_on: []
parallel_safe: false
```

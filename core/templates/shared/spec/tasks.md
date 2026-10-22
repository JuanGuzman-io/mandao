---
schema_version: 1
spec: <ID>-<slug>
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
---

# Tasks — <title>

<2–3 lines: the work and its order.>

## Overview

## Details

### [ ] T1 — <result, in plain words>

- **What:** <what it does and why; the how is in [design](design.md#d1)>.
- **Done when:**
  - S-1.1 holds: <behavior>.

```yaml
project: <project>
kind: feat
tier: standard
files: [path/to/file.ts]
exemplar: path/to/similar.ts
ac: [AC-1, AC-1/C1]
scenarios: [S-1.1, S-1.1/C1]
test_levels: { S-1.1: unit, S-1.1/C1: unit }
evidence: tdd
risk_tags: []
decisions: []
depends_on: []
parallel_safe: false
verify: <command>
```

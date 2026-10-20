---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
status: approved
---

# Tasks — Prove that a crashing doctor never sends garbage to CI

One test-only task proves both criteria in a real process.

## Overview

### AC-1, AC-2 — Invalid lock: error on stderr, empty stdout, exit 1; Invalid models file: reported as a finding, not a crash

- [x] T1 [AC-1, AC-2] A real doctor process fails cleanly on a broken lock or models file — `test/integration/doctor-process.test.ts`

**Checkpoint:** `npx vitest run test/integration/doctor-process.test.ts test/integration/doctor-cli.test.ts` passes (T1); this confirms AC-1, AC-2 before the next group.

## Details

### [x] T1 — A real doctor process fails cleanly on a broken lock or models file

- **What:** runs the built CLI as a separate process on broken workspaces, so CI's view of exit code,
  stdout and stderr is proven, not mocked ([design D1–D6](design.md#d1)).
- **Done when:**
  - S-1.1 and S-1.2 hold: exit 1, empty stdout, stderr names the lock.
  - S-2.1 and S-2.2 hold: exit 1, one JSON report with the models error, empty stderr.
  - The file runs in `npm test` in under 5 s (NFR-1).
  - The S-2.2 comment in `doctor-cli.test.ts` points to the new test; nothing under `src/` changes.
- **Notes:** no TDD red: the tests pin down existing behavior, so each assertion is proven by a recorded
  mutation instead ([log](_log/execution.md#mutation-evidence-t1)).

```yaml
project: mandao
kind: test
tier: standard
files: [test/integration/doctor-process.test.ts, test/integration/doctor-cli.test.ts]
ac: [AC-1, AC-1/C1, AC-1/C2, AC-2, AC-2/C1]
scenarios: [S-1.1, S-1.1/C1, S-1.1/C2, S-1.2, S-1.2/C1, S-2.1, S-2.1/C1, S-2.2, S-2.2/C1]
test_levels: { S-1.1: e2e, S-1.1/C1: e2e, S-1.1/C2: e2e, S-1.2: e2e, S-1.2/C1: e2e, S-2.1: e2e, S-2.1/C1: e2e, S-2.2: e2e, S-2.2/C1: e2e }
evidence: mutation
risk_tags: []
depends_on: []
parallel_safe: false
verify: npx vitest run test/integration/doctor-process.test.ts test/integration/doctor-cli.test.ts
```

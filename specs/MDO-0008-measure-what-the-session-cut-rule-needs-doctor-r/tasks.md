---
schema_version: 1
spec: MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r
status: approved
---

# Tasks — Measure what the session-cut rule needs

Four tasks. The doctor finding (T1) and the measurement (T2) are independent. Kaizen shows the
measurement (T3), then compares and proposes (T4). T3 and T4 both edit `src/cli/run-close.ts` and
`core/commands/close.md`, so they run in order.

## Overview

### AC-1 — doctor reports the cache duration in use

- [ ] T1 [AC-1] [P] doctor reports the Claude Code prompt-cache TTL and its source — `src/engine/doctor-cache.ts`

**Checkpoint:** `npx vitest run test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts` passes (T1); this confirms AC-1 before the next group.

### AC-2 — pauses and turns are measured from the spec's sessions

- [ ] T2 [AC-2] [P] a spec's sessions measured: pauses and turns per task, verify and close — `src/scripts/session-turns.ts`

**Checkpoint:** `npx vitest run test/unit/session-turns.test.ts test/unit/session-cut.test.ts` passes (T2); this confirms AC-2 before the next group.

### AC-3 — Kaizen shows the measurements

- [ ] T3 [AC-3] Kaizen shows a spec's pauses and turns — `src/cli/run-close.ts`

**Checkpoint:** `npx vitest run test/integration/close.test.ts` passes (T3); this confirms AC-3 before the next group.

### AC-4 — Kaizen compares with the rule and proposes new values

- [ ] T4 [AC-4] Kaizen compares with the session-cut constants and proposes new values — `src/spec/kaizen-sessions.ts`

**Checkpoint:** `npx vitest run test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/integration/close.test.ts` passes (T4); this confirms AC-4 before the next group.

## Details

### [x] T1 — doctor reports the Claude Code prompt-cache TTL and its source

- **What:** the TTL finding of [FR-1](spec.md#fr1) with the resolution of [D1](spec.md#d1).
- **Done when:**
  - S-1.1 to S-1.7 hold, with settings files, agent files and the probe in a temporary home and project.
  - S-1.2/C1: the settings files' content and modification times are identical after the run.
  - S-1.3/C2: an ignored value is named and the bucket goes on to the next step.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/engine/doctor-cache.ts, src/engine/doctor.ts, test/unit/doctor-cache.test.ts]
exemplar: src/engine/doctor-harness.ts
ac: [AC-1, AC-1/C1, AC-1/C2]
scenarios: [S-1.1, S-1.2, S-1.2/C1, S-1.3, S-1.3/C2, S-1.4, S-1.5, S-1.6, S-1.7]
test_levels: { S-1.1: unit, S-1.2: unit, S-1.2/C1: unit, S-1.3: unit, S-1.3/C2: unit, S-1.4: unit, S-1.5: unit, S-1.6: unit, S-1.7: unit }
evidence: tdd
risk_tags: [input]
depends_on: []
parallel_safe: true
verify: npx vitest run test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts
```

### [x] T2 — a spec's sessions measured: pauses and turns per task, verify and close

- **What:** `session-turns.ts` and `taskCommitTimes` per [D2](spec.md#d2) and [D3](spec.md#d3), from
  fixture transcripts and cost records.
- **Done when:**
  - S-2.1 to S-2.4 hold, with their clauses.
  - The reload of D3 and the actual turns after each `session-cuts.md` row are part of the result.
  - `session-cut.test.ts` still passes with `mainResponse` exported.

```yaml
project: mandao
kind: feat
tier: strong
files: [src/scripts/session-turns.ts, src/scripts/session-cut.ts, src/scripts/commits.ts, test/unit/session-turns.test.ts, test/unit/commits-times.test.ts]
exemplar: src/scripts/session-cut.ts
ac: [AC-2, AC-2/C1, AC-2/C2]
scenarios: [S-2.1, S-2.1/C1, S-2.2, S-2.2/C1, S-2.3, S-2.3/C1, S-2.4, S-2.4/C2]
test_levels: { S-2.1: unit, S-2.1/C1: unit, S-2.2: unit, S-2.2/C1: unit, S-2.3: unit, S-2.3/C1: unit, S-2.4: unit, S-2.4/C2: unit }
evidence: tdd
risk_tags: [input, pii]
depends_on: []
parallel_safe: true
verify: npx vitest run test/unit/session-turns.test.ts test/unit/session-cut.test.ts
```

### [ ] T3 — Kaizen shows a spec's pauses and turns

- **What:** `sessions` in `mandao run kaizen <spec>` from T2's measurement, close step 1 telling Kaizen
  to show it, and `## Sessions` in the Kaizen template ([FR-3](spec.md#fr3)).
- **Done when:**
  - S-3.1 holds: the JSON field with pauses, turns per task, verify, close, after tasks and missing sessions.
  - After `mandao sync`, the generated close command and Kaizen template carry the step and the section.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/cli/run-close.ts, core/commands/close.md, core/templates/shared/close/kaizen.md, test/integration/close.test.ts]
exemplar: src/cli/run-close.ts
ac: [AC-3]
scenarios: [S-3.1]
test_levels: { S-3.1: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: [T2]
parallel_safe: false
verify: npx vitest run test/integration/close.test.ts
```

### [ ] T4 — Kaizen compares with the session-cut constants and proposes new values

- **What:** `kaizen-sessions.ts` per [D4](spec.md#d4), `sessionCut` in `mandao run kaizen-compare`, and
  close step 1 reporting it with its sample size ([FR-4](spec.md#fr4)).
- **Done when:**
  - S-4.1 to S-4.4 hold, with their clauses.
  - Below the minimum, close writes "insufficient data (minimum 3)" and proposes nothing.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/spec/kaizen-sessions.ts, src/spec/index.ts, src/cli/run-close.ts, core/commands/close.md, test/unit/kaizen-sessions.test.ts]
exemplar: src/spec/kaizen-costs.ts
ac: [AC-4, AC-4/C1, AC-4/C2]
scenarios: [S-4.1, S-4.2, S-4.3, S-4.3/C1, S-4.4, S-4.4/C2]
test_levels: { S-4.1: unit, S-4.2: unit, S-4.3: unit, S-4.3/C1: unit, S-4.4: unit, S-4.4/C2: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: [T3]
parallel_safe: false
verify: npx vitest run test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/integration/close.test.ts
```

---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
audience: developers
language: en
---

# Technical notes — Filter pinned skills by vetting

## What was built
- mandao · `src/cli/skills.ts`: pure `filterByVetting(skills, filter?)`, applied once before both the text
  and the JSON output of `skillsList`; `--vetted` with `--unvetted` throws, and the CLI entry point
  exits 1. `src/cli/extensions.ts`: the two options. Commit 73b710d (Refs: MDO-0002, Mandao-Task: T1).

## Decisions and pivots
- D1 as designed (filter once). Deviation from the design summary: the mutual-exclusion check lives in
  `skillsList`, not in `extensions.ts` (Reviewer advisory 1); it also protects direct callers. No pivots.

## Contract changes
None.

## Diagram and drift
`mandao run diagram-drift`: no drift. The approved graph was corrected before the comparison: `src/engine`
(lock reader) was marked `context` — it is used, not changed — after the `role` field was added
(485f22b). The edge `src/cli -> src/engine` is unverified by the code graph (the worktree's graph had not
indexed `src/cli/skills.ts`); checked by hand: `src/cli/skills.ts` imports `readLock` from
`src/engine/files.ts`.

## How to test
`npx vitest run test/integration/cli.test.ts`; by hand: `mandao skills list --vetted --unvetted; echo $?` → 1.

## Links
Spec `specs/MDO-0002-filter-pinned-skills-by-vetting/`; no tracker story (local id).

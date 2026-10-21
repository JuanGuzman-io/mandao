# src/spec — spec execution domain

Purpose: parse and evaluate spec state, task dependencies, evidence, traceability, costs and closure.
The CLI and scripts gather inputs; writer helpers own persistence.

- Copy `loop.ts` for decision logic. Return structured actions; keep side effects in scripts/CLI.
- RED evidence gates TDD; characterization uses mutation evidence. No new implementation step until
  the required evidence exists (`loop.ts`, `test/integration/tdd.test.ts`).
- Two FAILs escalate a tier; three at strong halt. Do not lower reviewer effort or silently discard
  a security blocker. Whole reviews and attempt counts come from the script-owned log (ADR 0039).
- Approval records and integrity hashes are provenance, not cryptographic identity guarantees.
- Costs distinguish actual usage and estimates; a subscription list-price equivalent is not a bill.
- Unit-test decisions and integration-test recording through temporary workspaces made by `makeTree`.
- `next.ts`: `nextStep` is pure and only recommends; it never offers implement before approval or past an open item (`NEEDS CLARIFICATION`, `CONFLICT` inline or as a Consistency Check row, a critical Consistency Check row, a pending decision; resolved rows are ignored). Lite is `spec.md` existing (`SpecFolder.lite`). Hashes ignore `status:` and `tasks.md`; a missing hash means no claim. Change-after-approval compares approval rows only; `shown` rows (`run next --shown`) are compared only by `approve --by-running`.

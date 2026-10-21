# src/writer — the only module that writes generated files

Purpose: plan changes against disk and lock, detect drift and orphans, apply (ADR 0003).

- `plan.ts` is pure over its inputs plus reads; `apply.ts` writes and prunes empty folders.
- Owned files are hashed whole; managed blocks are hashed block-only.
- Never overwrite drift without `force`; keep the old lock entry so drift stays visible.

Gotcha: engine and CLI orchestration writes user-intent files through this module's `writeText`,
`createIfMissing` and `editYaml` helpers; it must not call filesystem writes directly (ADR 0007).
`log-integrity.ts` tracks script-owned spec evidence; preserve discrepancy detection when changing it.

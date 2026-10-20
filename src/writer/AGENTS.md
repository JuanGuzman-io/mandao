# src/writer — the only module that writes generated files

Purpose: plan changes against disk and lock, detect drift and orphans, apply (ADR 0003).

- `plan.ts` is pure over its inputs plus reads; `apply.ts` writes and prunes empty folders.
- Owned files are hashed whole; managed blocks are hashed block-only.
- Never overwrite drift without `force`; keep the old lock entry so drift stays visible.

Gotcha: user-intent files (`config.yml`, `models.yml`, the lock) are written by `src/engine/files.ts`
and the CLI, not here (see the CONFLICT in `docs/constitution/architecture.md`).

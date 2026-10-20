# 0007 — Pure adapters, one writer for every file

**Status:** Accepted · amended 2026-10-20 (all writes, not only generated files)

## Context
Harness formats change often. Adapters must be cheap to write, cheap to test, and safe to run.

The first dogfooding run of `/mandao-constitution` on this repository found a `CONFLICT` against the
original wording of this ADR ("only src/writer/ touches the filesystem"): `config.yml`, `models.yml`,
`sources.yml`, the lock and `.gitignore` were written from `src/engine/files.ts` and from several CLI
commands. Those writes skipped the idempotence and hand-edit protection that generated files had.

## Decision
- An adapter is a pure function `render(input) → { files, warnings }`. It performs no I/O; anything
  that needs the disk (module guides, model files) is gathered by the engine and passed in.
- Capabilities and tiers are mapped per adapter. Tools a harness does not know are left out, never
  guessed.
- `AGENTS.md` is a harness-neutral output: a managed block in the root and in each project. Managed
  blocks use the comment syntax of their file (`<!-- mandao:begin -->` in Markdown, `# mandao:begin`
  elsewhere). Content outside the markers is never touched.
- **Every filesystem write goes through `src/writer/`**:
  - generated files through the change plan (hashes, drift, orphans);
  - user-intent files through `writeText` (idempotent), `createIfMissing` (never replaces user content)
    and `editYaml` (keeps comments; fails with `ConcurrentEditError` if the file changed on disk
    between reading and writing).
- `test/unit/architecture.test.ts` fails when any file outside `src/writer/` calls a filesystem write.
- `sync` and `doctor` share `buildProject`, so `doctor` compares the disk against exactly what `sync`
  would write.

## Consequences
- Adding a harness means one file plus snapshots.
- A harness without model selection per agent turns the reviewer rule into an instruction plus a
  `doctor` finding.
- New CLI features cannot write files ad hoc; they call the writer.

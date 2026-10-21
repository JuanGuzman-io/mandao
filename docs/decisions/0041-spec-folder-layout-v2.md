# 0041 — Spec folder layout version 2

**Status:** Accepted · 2026-10-21 · MDO-0011 · design D1

Spec folders grew different shapes by depth and by date: inline tasks up to a count, root versus `_log/`
logs, optional files nobody listed. Nothing read a spec's version, and "lite" meant only that `spec.md` exists.

## Decision

- **The layout version is the story's `schema_version`:** 1 for older specs, 2 for new ones; any other value
  is an error. There is no separate `layout:` key, and the version is never inferred from the files present
  (a broken version 2 folder would pass as version 1).
- **One manifest, `layoutManifest(version, depth)` in `src/spec/layout.ts`,** lists the required files per
  stage and the allowed conditionals. `layoutFindings({ story, docs, entries })` is pure (`readLayout` in `src/scripts/spec.ts` reads the folder) and returns `{ version, depth, stage, missing,
  unexpected, ok }`. `docs/spec-anatomy.md` is built from the same manifest.
- **Depth** is the `depth:` frontmatter of `spec.md`, `requirements.md` or `design.md`; lite when it is missing
  and `spec.md` exists, else standard.
- **`mandao run layout <spec>`** prints the findings and exits 1 when `ok` is false. `mandao run status <spec>
  closed` refuses a folder that does not match, naming the findings.
- **Version 1 is accepted in its own format:** its manifest also allows the root log files (`execution.md`,
  `progress.yml`, …), and asks for nothing after the documents and tasks.
- **An AC with `status: removed`** keeps its number and is skipped by `trace` and `release-status`.

## Consequences

- `close-summary.md` is required from T5 on; until then the close gate checks the folder at the `verified` status, which does not require it.
- `approved` counts as the draft stage: it is set before specify runs.
- Later tasks of MDO-0011 move the version 2 log to six files and `tasks.md` to every depth; this ADR fixes the
  check they are measured against.
- Migrating MDO-0008 to MDO-0010 is a separate spec.

---
schema_version: 1
rule: doc-design
---

# design.md

Applies the principles in `spec-docs.md`.

- The summary says how the requirements are met. The body starts with the decisions.
- **Decisions:** `### Dn — <decision>` with why and the alternatives rejected in one compact list.
- **Changes by project and module:** project, module, change and an exemplar file to mimic.
- **Contract:** mandatory when the spec touches more than one project.
- **Risks and risk tags:** `auth`, `input`, `pii`, `payments`, `migration`, `public-api`, `infra`,
  `ai-prompt`, `ui`, `perf`.
- **Constitution / Product / Module Docs Impact:** proposals only; close applies them with approval.
- **Diagram:** written by `mandao run diagram --stamp` from this design; regenerated when it changes.
- **Premise Ledger** (at the end): one `### Pn — <claim> (High|Low)` per claim about the existing
  system whose falsity would change a decision, task or scope item, with what changes if false. A High
  premise counts as verified only with an executed command and an excerpt of its output (read-only, in
  the worktree or a sandbox, with a timeout, through the resource guard); a search or a read is not
  enough. The run is recorded with `mandao run premise <spec> <Pn> -- <command>`, from the worktree: probe
  scripts go in the spec's `_log/premises/probes/`, never in a home folder or outside the repository; the
  command may not name a path outside the worktree, and its temporary files (`TMPDIR`) stay in
  `_log/premises/tmp/`, removed after the run; without a recorded
  run it is `UNVERIFIED`, and `trace` reports `PREMISE_UNPROVEN` otherwise. The outputs go in the
  evidence block.

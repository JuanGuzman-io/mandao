---
schema_version: 1
rule: doc-close
---

# Close documents

Applies the principles in `spec-docs.md`.

- **Kaizen** (`docs/kaizen/<ID>.md`): Measure from `mandao run kaizen` (rework, Reviewer FAILs,
  escalations, pivots, HALTs, independence, forced runs, TDD practice, bugs after merge with its note);
  TDD comparison from `mandao run kaizen-compare` with both sample sizes ("insufficient data" below the
  minimum, and no conclusion); Learn: 0–3 root-cause lessons with evidence; Standardize: 1–3 one-line
  edits, each pending approval.
- **Release notes:** business language, no code names; one row per criterion with the status from
  `mandao run release-status` (met, partial, pending; never upgraded by hand); partial and pending say
  what is missing and what happens next.
- **Technical notes:** what was built per project and module, with the commits found by their trailers;
  decisions and pivots; contract changes; the built diagram against the approved one, explaining every
  node or edge `mandao run diagram-drift` reports; how to test; links.

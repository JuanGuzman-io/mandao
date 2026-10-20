---
schema_version: 1
rule: doc-tasks
---

# tasks.md

Applies the principles in `spec-docs.md`.

- **`## Overview`**, generated from the details by `mandao run tasks <spec> --index --write` (the
  validator fails when they differ): grouped by acceptance criteria, one line per task —
  `- [ ] T2 [AC-1] [P] <result in plain words> — <main file>` (`[P]` only when `parallel_safe`) — and a
  checkpoint per group: what to run to confirm those criteria before the next group.
- **`## Details`**, one `### [ ] Tn — <result>` per task, never repeating the title or the index:
  - **What:** 1–2 sentences on what it does and why, linking the design for the how.
  - **Done when:** 3–5 bullets of behavior. Cite scenarios by id and add only what requirements do not
    say; never repeat design decisions.
  - **Notes** (only when needed): a visible exception, e.g. "no TDD red: mutation evidence".
  - The YAML block, no prose: `project`, `kind`, `tier`, `files`, `exemplar`, `ac`, `scenarios`,
    `test_levels` (`unit | e2e | eval | none` per scenario), `evidence` (`tdd | mutation | none`),
    `risk_tags`, `depends_on`, `parallel_safe`, `verify`.
- The title is the result, never a file path. Concrete test names are chosen by whoever writes the
  tests; the declared level per scenario is what the Reviewer checks.

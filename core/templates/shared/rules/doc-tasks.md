---
schema_version: 1
rule: doc-tasks
---

# tasks.md

Applies the principles in `spec-docs.md`.

- **`## Overview`**, generated from the details by `mandao run tasks <spec> --index --write` (the
  validator fails when they differ): grouped by acceptance criteria, one line per task —
  `- [ ] T2 [AC-1] [P] <result in plain words> — <main file>` (`[P]` only when `parallel_safe`) — and a
  checkpoint per group: what to run to confirm those criteria before the next group. When tasks declare
  `delivery`, each delivery is a `### Delivery n — AC…` section holding its per-AC groups (`####`, each
  with its own Checkpoint) and one `**Delivery checkpoint:**` line naming the partial verify
  `mandao run verify-plan <spec> --delivery n` (never a verify of the spec; the final verify covers
  every AC).
- **`## Details`**, one `### [ ] Tn — <result>` per task, never repeating the title or the index:
  - **What:** 1–2 sentences on what it does and why, linking the design for the how.
  - **Done when:** 3–5 bullets of behavior. Cite scenarios by id and add only what requirements do not
    say. Do not repeat decision rationale or alternatives; include a rejected alternative only as an
    observable must-not when it adds a behavior constraint absent from the requirements.
  - **Notes** (only when needed): a visible exception, e.g. "no TDD red: mutation evidence".
  - The YAML block, no prose: `project`, `kind`, `tier`, `files`, `exemplar`, `ac`, `scenarios`,
    `test_levels` (`unit | e2e | eval | none` per scenario), `evidence` (`tdd | mutation | none`),
    `risk_tags`, `partial_failure_tests` (test names for ACID partial-failure coverage), `decisions`
    (linked `D<n>` ids), `depends_on`, `parallel_safe`, `verify`, and optionally `delivery` (a number; all tasks or none, no gaps,
    never depending on a later delivery, each delivery meeting at least one AC).
- Use the `security` risk tag when a task changes a security boundary, credential handling, scanning,
  authorization or a vulnerability remediation.
- The title is the result, never a file path. Concrete test names are chosen by whoever writes the
  tests; the declared level per scenario is what the Reviewer checks.

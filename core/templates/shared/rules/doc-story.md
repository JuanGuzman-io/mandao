---
schema_version: 1
rule: doc-story
---

# story.md

Applies the principles in `spec-docs.md`.

- **Who / Problem / Value:** short paragraphs in the product's own words (`glossary.md`).
- **Scope / Out of scope:** bullets.
- **Acceptance criteria:** one `### AC-n — <short name>` block per criterion, numbers stable,
  `critical: true` when it touches a flow in `critical-flows.md`; GIVEN / WHEN / THEN, with `BUT it must
  NOT` / `AND IT MUST` clauses for the edges that matter (C1, C2…).
- **Assumptions and open questions:** `ASSUMPTION`, `OPEN` or `CONFLICT`, each with its source. A
  critical `OPEN` blocks specify.

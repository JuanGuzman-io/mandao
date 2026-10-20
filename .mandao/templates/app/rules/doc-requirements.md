---
schema_version: 1
rule: doc-requirements
---

# requirements.md

Applies the principles in `spec-docs.md`.

- **FR-n** with `Serves:` and `Projects:` lines, the requirement in one or two sentences, then its
  scenarios `#### S-n.m` (Given / When / Then and the clauses).
- **NFR-n:** a number and how it is measured, never an adjective.
- **AC → FR matrix:** short cells (`main`, `C1: nothing on stdout`).
- **Clarifications:** `### C-n — <question> (date)` with Answer, Answered by and Effect bullets.
- **Consistency Check:** a short table (ID, type, severity, owner, status) and a subsection per finding
  whose sides need more than a phrase. "No findings" when empty.
- **Open items:** `[NEEDS CLARIFICATION]`, `ASSUMPTION`, `OPEN`, `CONFLICT`.

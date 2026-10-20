---
schema_version: 1
rule: doc-verify
---

# verify-report.md

Applies the principles in `spec-docs.md`.

- The summary is the verdict and why.
- **Acceptance criteria → tests** first: bare `AC-n` / `AC-n/Cn` in the first column (`release-status`
  reads it), the result in the last; one short subsection per criterion when the proof needs words.
- Then Suites, TDD evidence, Product bugs, Deferred to CI, Blockers; commands and outputs in
  `## Evidence`.

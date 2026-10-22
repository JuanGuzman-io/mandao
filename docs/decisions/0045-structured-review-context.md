# 0045 — Structured review context and findings

**Status:** Accepted · 2026-10-21

## Context

The Reviewer received a broad workspace diff and the Implementer brief did not carry the design choices
that shaped a task. Security blocking also depended on tagged Markdown text, so presentation affected
the guard.

## Decision

- Send the Reviewer canonical changed files. Replace owned generated harness files with a hash and origin
  receipt only when the current hash matches `.mandao/mandao.lock`; replace diagram SVG diffs only when
  their source references, specification hash and generated marker agree. Keep the complete diff when
  provenance cannot be verified.
- A task may link relevant design decisions by `D<n>` IDs. The brief carries those decision sections,
  including rationale and rejected alternatives, and a reference-only checklist of the task's AC and
  scenario clauses. Task prose may add a concise observable must-not only when it adds a behavior
  constraint; it does not duplicate decision rationale.
- Reviewer output includes a versioned JSON findings envelope with `status` and `severity`. The guard
  blocks only findings that are open, security-lens, and high or critical. Free-form prose is not guard
  input. Missing or invalid structured output cannot pass review.

## Consequences

Generated review context is smaller while unverifiable changes remain visible. Briefs carry rejected
alternatives only for decisions explicitly linked to a task. Reviewers must conform to the JSON schema;
the CLI validates it before recording a PASS.

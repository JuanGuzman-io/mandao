# 0047 — Gated design principles and data-write validation

**Status:** Accepted · 2026-10-22 · Phase 3b

## Context

Generic design principles can encourage needless abstraction unless teams record their chosen
architecture and framework conventions first. Prose-only checks also let specs omit atomicity and
partial-failure coverage for multi-write operations.

## Decision

- A constitution may declare stack-specific principles as stable `DP-*` rows in `standards.md`.
  `constitution` proposes these for approval; in active mode they are a diff, never an automatic edit.
- Precedence is declared architecture, documented framework conventions, then generic principles
  only where the first two are silent. A framework is not wrapped in a duplicate abstraction.
- A v2 design, including lite `spec.md`, declares `writes_data: yes | no` and has a deterministic
  Principle check with one complete row per declared principle. The gate is conditional on the
  constitution; `doctor` reports a missing declaration as information, not an error.
- A data model file or a task tagged `data` or `migration` implies `writes_data: yes`; disagreement
  with explicit `no` is a validation finding. Effective data writes require a structured ACID table
  and at least one task-declared partial-failure test.
- Layout, trace and verify enforce these requirements. The Reviewer blocks unjustified violations
  only for principles declared applicable; all other principle suggestions are advisory.

## Consequences

- New and active constitutions remain human-approved; existing projects are not silently rewritten.
- Task metadata gains `partial_failure_tests`, and `data` becomes a risk tag selecting the data lens.
- Legacy layout v1 remains readable without retroactive principle metadata requirements.

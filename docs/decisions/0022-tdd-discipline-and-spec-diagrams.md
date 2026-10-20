# 0022 — TDD and professional discipline; diagrams to approve in specify

**Status:** Accepted · 2026-10-20 · **design only**: implemented in iteration 2b

## 1. TDD where tests are mandatory

Applies where the test policy (design §16.1) says "always tested"; where it says "not tested", TDD does
not apply.

- **Red → green → refactor:** first a red test derived from the scenario or clause, then the minimum
  code to pass it, then refactor within the task's scope.
- **Red evidence:** the Implementer records in `execution.md`, with the output of `mandao run tests`,
  that the test failed for the expected reason before implementing. The Reviewer FAILs the task without
  it.
- **No weakening a red test.** Any change to a test written in the red phase is a discrepancy reported
  to the Reviewer.
- **Tests by another agent** for tasks with risk tags or tier strong: the Tester writes the red tests
  from the spec; the Implementer makes them pass.
- **Measurement:** Kaizen compares specs with and without TDD — rework rate, Reviewer FAILs, bugs after
  merge — to validate the impact with data.

## 2. Professional discipline

Principles from *The Clean Coder*, written into the personas as checkable rules, never as "follow the
book":

- Say no, or HALT, when something cannot be done well, instead of delivering something partial as done.
- "Done" means the whole Definition of Done is met, with evidence.
- Never report something as tested without the test output.
- State uncertainty explicitly instead of assuming.

**Module boundaries** become an `architecture.md` rule the core Reviewer verifies: one responsibility
per module, communication between modules only through public contracts, no access to another module's
internals.

## 3. Diagrams to approve in specify

- `specify` generates with Archify the diagram of the proposed flow, **derived from `design.md`**,
  never drawn by hand. The type comes from the table in design §18.3.
- Mandatory at standard and full depth when there is a new flow or the spec touches several projects;
  optional at lite.
- Part of the design approval: the PO or lead approves looking at the diagram. With a tracker MCP it is
  attached to the story as PNG; without Archify, Mermaid.
- When `design.md` changes, the diagram is regenerated.
- In `close`, the diagram of what was implemented (derived from the diff) is compared with the one from
  `specify`; differences are reported as **drift** and explained in the technical doc.

## Consequences

- 2b adds: a red-evidence row or field in `execution.md` and the Reviewer check; Tester-first tasks in
  `tasks`; persona rules; an `architecture.md` section in the constitution template; a diagram step in
  `specify` and drift in `close`; Kaizen fields to compare TDD and non-TDD specs.

## Implementation (iteration 2b, 2026-10-20)

**TDD and discipline — implemented.**
- Verdict `RED`. `mandao run red <spec> <Tn> <tests> --agent <agent>` runs the tests (budget and queue
  of `mandao run tests`) and records the row only when they fail; a pass or a run without a verdict is
  not evidence. The writer's identity comes from its agent file (ADR 0021).
- Each red test's hash goes to `progress.yml` (`red_tests`); a later change is noted as
  `red test changed: <files>` on the next checkpoint and listed in the brief (`redTests.changed`).
- `loop` returns `tdd: { required, testsBy, red }`: required when the task declares tests; `testsBy:
  tester` (action `write-red-tests` before implementing) for risk tags or tier strong; a review
  without red evidence carries the note `no red evidence`, which the Reviewer FAILs.
- Discipline rules in the Leader, Implementer, Tester and Reviewer personas; module boundaries in the
  `architecture.md` template and in the Reviewer's checklist.
- **Pending until `close` and Kaizen exist:** the comparison of specs with and without TDD. The data is
  already in `execution.md` (RED rows, FAILs).

**Diagrams — implemented in specify; drift waits for `close`.**
- `mandao run diagram <spec>` reports `required` (`yes` at standard/full depth across projects,
  `if-new-flow` in one project, `optional` at lite), the stamp and `stale`. `--stamp` records the diagram
  just generated (Archify file, or Mermaid embedded as the fallback) with the hash of `design.md`
  without its `## Diagram` section, so any later change to the design reports `stale: true`.
- `specify` step 7 derives the diagram from `design.md` by type (design §18.3), shows it in the approval
  and offers to attach the PNG to the story through the tracker MCP after confirmation; `clarify`
  regenerates it when an answer changes the design.
- Pending until `close` exists: the diagram of what was built, derived from the diff, compared with the
  approved one as drift.

**Amended by ADR 0033 (2026-10-20):** tasks that only pin down existing behavior (`characterization:
true`) prove their tests with recorded mutations (`MUTANT` rows) instead of a red run; Kaizen counts them
apart as `characterization`.

# How Mandao keeps the quality

What the [README](../README.md) promises, and how each promise is kept. Every rule below is enforced by a
script or a gate, not only asked of the agent.

## Test-driven development (TDD)

TDD means writing a test for the expected behavior **before implementing it**. In `/mandao-implement`, tasks
that require tests follow **RED → GREEN → REFACTOR**:

1. **RED:** tests derived from the spec's scenarios fail for the expected reason. For tasks with risk tags or
   tier `strong`, a separate **Tester** writes them; otherwise, the **Implementer** does.
2. **GREEN:** the Implementer writes the minimum code that makes them pass.
3. **REFACTOR:** improve the code within the task's scope, tests still green. Gates and an independent Reviewer
   check the result before a local commit.

**Why:** tests written after the code can simply repeat its assumptions. Seeing them fail first shows they can
detect the missing behavior or reproduce the bug.

**How it is enforced:** `mandao run red` records a `RED` row only after a failing run, and the loop withholds
implementation until that evidence exists. A test that passes on its first run needs one of two alternatives:
a killed mutation probe (`mandao run mutation --for-first-pass`) or an independent test review
(`mandao run test-review`). Removed test cases need a recorded reason and appear in the Reviewer's pack.
Documentation-only tasks need no red test; **characterization tasks**, which protect existing behavior, use
mutation evidence instead.

See the [test policy](../core/templates/shared/rules/test-policy.md#tdd-where-tests-are-mandatory-adr-0022) and
[ADR 0022](decisions/0022-tdd-discipline-and-spec-diagrams.md).

## An independent review, kept small

- Every task is reviewed by a separate agent in a clean context: another model, or another harness when both
  would be the Implementer's model. The record says when independence was reduced.
- The Reviewer gets the task's diff only: its declared files and the ones the Leader names. Generated harness
  copies and diagram SVGs arrive as hash-and-origin receipts.
- Each task brief links only the design decisions it needs, with their rationale, and an acceptance-criterion
  checklist.
- Findings use a validated JSON format with `open`/`resolved` status and severity; only an open high or
  critical security finding blocks a PASS ([ADR 0045](decisions/0045-structured-review-context.md)).

## Gates from the start

The constitution proposes every gate a later command needs in one approval: format, lint, typecheck, test,
build (or `none`), secrets, sast, audit, and `eval` when the project evaluates a model. Task gates run the
impacted tests only; the full suite runs in CI ([ADR 0060](decisions/0060-gates-and-task-scoped-commits.md)).

Designs carry a principles gate: the Reviewer enforces only the approved principles marked applicable, and a
design that writes data declares its ACID handling and a partial-failure test
([ADR 0047](decisions/0047-gated-design-principles-and-data-write-validation.md)).

## Evidence, not memory

- **Stack checks.** Each stack choice in the constitution is proven on your runtime
  (`mandao run stack-check S<n> -- <command>`) or marked `UNVERIFIED`, and the runtime is pinned; `mandao doctor`
  warns on a choice with no run or a failed one ([ADR 0061](decisions/0061-constitution-checked-on-the-runtime.md)).
- **Premises.** A design premise that would change a decision if false is run, read-only, before the design is
  approved (`mandao run premise`), or stays `UNVERIFIED` ([ADR 0033](decisions/0033-mdo-0005-run-identity-kind-characterization.md)).
- **Research.** Inside `/mandao-specify`, unfamiliar and version-bound choices are researched into dated sources;
  model memory alone cannot justify a high-impact decision. Web-search servers are declared per harness in
  `research.web_search_servers`.
- **Approved means approved.** An approval records the hash of what was approved and of the constitution it
  relied on. A document changed after it, or a constitution reopened later, sends the spec back to update and
  approve again.

## Dependencies and accepted risks

The constitution's `standards.md` separates direct dependencies (an allow-list) from unmodified transitive ones
(weak copyleft and PSF allowed, strong copyleft blocked). A known vulnerability that cannot be fixed now is
accepted only by a person, with its reachability reason and when to review it
(`mandao approve <spec> vulnerability`), and close lists it in the delivery notes.

## Kaizen after every spec

`/mandao-close` measures rework, review failures, cost and session timing. Script-stamped events separate active
time from human and agent waits. Kaizen names up to three evidence-backed causes and proposes fixes; nothing
changes until you approve it. Lessons stay in the spec's `close-summary.md`.

## Skill installs

Catalog skills install at a pinned version; repository skills require HTTPS and are copied at a pinned commit,
without their executable scripts unless you ask (`--with-scripts`). Git keeps your `GIT_SSH_COMMAND`.

---
schema_version: 1
tracker: none
type: enhancement
id: MDO-0007
url:
parent: MDO-0006
projects: [mandao]
lane: normal
status: in-progress
sources:
  - { ref: "user request (/mandao-specify input)", kind: chat, date: 2026-10-20 }
  - { ref: "specs/MDO-0006-leave-no-temporary-folders-behind-after-the-test/execution.md:33 (T3 Reviewer advisory)", kind: repo, date: 2026-10-20 }
  - { ref: "test/unit/architecture.test.ts:32-40 (current guard)", kind: code, date: 2026-10-20 }
  - { ref: "docs/constitution/standards.md:23-25", kind: constitution, date: 2026-10-20 }
  - { ref: "prototype scan over test/ and the current guard's regex, as run (spec.md Evidence)", kind: command, date: 2026-10-20 }
---

# Catch every way a test can climb out of its workspace

A maintainer needs the suite to fail whenever test code builds a path that leaves its temporary
workspace, in any of the shapes that can leak, not only the one shape the guard checks today.

## Who
A Mandao maintainer or contributor who writes tests and relies on the architecture guard to keep
them inside their `makeTree` workspace.

## Problem
MDO-0006 made every `makeTree` workspace disappear when its test file finishes and added a guard so
the leaks it fixed cannot return. That guard only recognises `join(<folder>, '..', …)` with `'..'` as
the second argument (`test/unit/architecture.test.ts:38`). The T3 Reviewer noted that other shapes
still escape unseen (`specs/MDO-0006-…/execution.md:33`). Checked on 2026-10-20: the guard misses
`join(ws, 'a', '..', '..')`, `join(ws, '../x')`, `resolve(ws, '..')` and a write into
`dirname(ws)`. A test using any of them would leave files in the temp folder again, silently.

## Value
- The MDO-0006 leaks cannot come back in another shape.
- A contributor learns at once, with the file and line, that a path leaves the workspace.

## Scope
- Every test source file under `test/`.
- Paths built with the `node:path` functions `join`, `resolve` and `dirname`, however they are
  imported.

## Out of scope
- Paths built by string concatenation or template strings, `new URL(…)`, or `dirname` applied more
  than once or to a value that only later becomes a workspace; the guard is a static check and
  catches the shapes above.
- Product code under `src/` (its writes are already guarded by ADR 0007).
- Changing what any existing test verifies.

## Acceptance criteria

### AC-1 — Every climbing shape fails the suite
critical: false

- **GIVEN** a test file under `test/`
- **WHEN** it builds a path with `join` or `resolve` that has a `..` segment in any argument, or
  takes `dirname` of a `makeTree` workspace
- **THEN** `npm test` fails and names the file and line of that call
- **AND IT MUST** keep catching the shape the guard catches today, `join(<folder>, '..')` (C1)

### AC-2 — Legitimate paths still pass
critical: false

- **GIVEN** test code that builds paths that stay inside the repository or the workspace
- **WHEN** the guard runs
- **THEN** it does not flag paths from `import.meta.dirname`, functions that are not from
  `node:path` (such as the resolver's own `resolve`), or `dirname` of a path inside a workspace
- **BUT it must NOT** exempt a whole file: a deliberate exception names the single call it allows and
  why (C1)

### AC-3 — The current suite passes unchanged
critical: false

- **GIVEN** the tests on `main` today
- **WHEN** the new guard is in place
- **THEN** `npm test` passes
- **BUT it must NOT** weaken, skip or remove any existing assertion (C1)

## Dependencies
- MDO-0006 (closed): the `makeTree` cleanup and the guard this story extends.

## UX references
- None: developer experience only.

## Data involved
- Test source files only. No user or personal data.

<a id="assumptions"></a>
## Assumptions and open questions

- ASSUMPTION(source: user request, 2026-10-20): the three shapes the Reviewer named, plus the one
  already guarded, are the scope; other shapes are listed under Out of scope. The maintainer can widen
  it at approval.
- ASSUMPTION(source: test/unit/helpers.test.ts:14-25): the look-alike test of MDO-0006 S-2.1 must
  create a folder next to a workspace on purpose and removes it itself, so it stays as the one named
  exception (AC-2/C1).

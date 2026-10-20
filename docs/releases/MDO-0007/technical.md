---
schema_version: 1
spec: MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work
audience: developers
language: en
---

# Technical notes — Catch every way a test can climb out of its workspace

The architecture guard now reads each test file's syntax tree and fails on any `node:path` `join` or
`resolve` call with a `..` segment, and on `dirname` of a `makeTree` workspace. Exceptions name one
call, not a file; there is one.

## What was built

Project `mandao`, test code only (nothing under `src/`, `core/` or the published package).

| Module | Change | Commit |
|---|---|---|
| `test/` | `test/guards.ts`: `findClimbs(file, source)` and `withoutAllowed(file, found, allowed)` | 62b1fd8 (T1), 2d40ed5 (T2) |
| `test/unit` | `guards.test.ts`: one test per scenario S-1.1 to S-4.1 | 62b1fd8, 2d40ed5 |
| `test/unit` | `architecture.test.ts`: the regex guard is replaced by "no test climbs out of its work folder" with `ALLOWED` | 2d40ed5 |
| `test/integration` | `mdo-0005-defects.test.ts:266` builds the parent folder with `dirname(join(root, f))` | 2d40ed5 |

- **Rules:** `join`/`resolve` imported from `node:path` (named, alias, namespace or default) with any
  string or plain template argument containing a `..` segment, unless the first argument is
  `import.meta.dirname`; `dirname` whose argument is a `makeTree(…)` call or a variable the checker
  traces to one (scope-aware).
- **The one exception:** `test/unit/helpers.test.ts`, `dirname(makeTree({}))`: MDO-0006 S-2.1 needs a
  look-alike folder next to a workspace and removes it in its own `finally`.
- **Known limits:** `path.posix.join`, `import { posix }`, templates with substitutions,
  `path['join']`, string concatenation and `new URL` are not checked; only `.ts` files are scanned;
  an exception matches by exact text, so an identical second call in the same file is also excused;
  `ALLOWED` paths use `/` and would not match on Windows.

## Decisions and pivots

D1–D5 in [spec.md](../../../specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/spec.md#d1):
syntax tree through the TypeScript compiler API (already a dev dependency) instead of a regex; every
`..` segment is forbidden rather than proving a path stays inside; a pure detector tested on snippets;
exceptions by call. No pivots.

## Contract changes

None.

## Diagram and drift

No diagram: optional at lite depth and none was approved, so `mandao run diagram-drift` has nothing
to compare (`design.md has no diagram with a structured graph`). No drift recorded.

## How to test

- `npx vitest run test/unit/guards.test.ts test/unit/architecture.test.ts`.
- To see the guard fail: add a test file under `test/` with `join(makeTree({}), '..')` and run
  `npx vitest run test/unit/architecture.test.ts`; it names the file and line.

## Open items

- **Project skill not applied (approved, item 2).** The harness refused writing
  `.claude/skills/codebase-conventions/SKILL.md` during close. Apply by hand at line 58:

  ```diff
  -  written outside the workspace (the setup file removes it after each test file);
  +  written outside the workspace (the setup file removes it after each test file): no `..` segment in
  +  `join`/`resolve` and no `dirname` of a workspace, or `test/unit/architecture.test.ts` fails;
  ```
- **Kaizen standardizations 3–5 (approved):** follow-up change, listed in
  [docs/kaizen/MDO-0007.md](../../kaizen/MDO-0007.md#standardize).

## Links

- [Verify report](../../../specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/verify-report.md)
- [Kaizen](../../kaizen/MDO-0007.md)
- Parent: MDO-0006 (the cleanup and the guard this extends).

## Evidence

- Commits found by trailers `Refs: MDO-0007`, `Mandao-Task: T1|T2`: 62b1fd8, 2d40ed5.
- Full suite at verify: 54 files, 401 tests passed (verify-report.md#e2).

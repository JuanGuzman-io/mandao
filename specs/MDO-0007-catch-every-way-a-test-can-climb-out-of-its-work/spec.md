---
schema_version: 1
spec: MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work
depth: lite
projects: [mandao]
status: approved
---

# Spec — Catch every way a test can climb out of its workspace

The architecture guard reports, with file and line, every `node:path` `join` or `resolve` call with a
`..` segment and every `dirname` of a `makeTree` workspace under `test/`. It reads the syntax tree
with the TypeScript compiler API instead of a regex, and allows only exceptions named call by call.

## Functional requirements

<a id="fr1"></a>
### FR-1 — `join` and `resolve` calls with a `..` segment are reported
Serves: AC-1, AC-1/C1
Projects: mandao

A call to `join` or `resolve` from `node:path`, imported by name, alias, namespace or default, is
reported when any string argument has a `..` segment, unless its first argument is
`import.meta.dirname`.

#### S-1.1 — Several segments that climb
- **Given** a test file with `join(ws, 'a', '..', '..')`
- **When** the guard runs
- **Then** it reports that file and the call's line

#### S-1.2 — `..` inside a longer segment
- **Given** a test file with `join(ws, '../x')` or ``join(ws, `a/../..`)``
- **When** the guard runs
- **Then** it reports each call with its line

#### S-1.3 — `resolve` and other import forms
- **Given** a test file with `resolve(ws, '..')`, `j(ws, '..')` after `import { join as j }`, or
  `path.resolve(ws, '..')` after `import * as path from 'node:path'`
- **When** the guard runs
- **Then** it reports each call with its line

#### S-1.4 — The shape guarded today
- **Given** a test file with `join(ws, '..', 'x')`
- **When** the guard runs
- **Then** it reports the call with its line

<a id="fr2"></a>
### FR-2 — `dirname` of a workspace is reported
Serves: AC-1
Projects: mandao

A `dirname` call from `node:path` is reported when its argument is a `makeTree(…)` call or an
identifier whose declaration is initialised with one.

#### S-2.1 — Directly on `makeTree`
- **Given** a test file with `dirname(makeTree({}))`
- **When** the guard runs
- **Then** it reports the call with its line

#### S-2.2 — Through a variable
- **Given** a test file with `const ws = makeTree({})` and later `writeFileSync(join(dirname(ws), 'x'), '')`
- **When** the guard runs
- **Then** it reports the `dirname(ws)` call with its line

<a id="fr3"></a>
### FR-3 — Paths that stay inside are not reported
Serves: AC-2
Projects: mandao

#### S-3.1 — Paths from the test file's own folder
- **Given** `join(import.meta.dirname, '../fixtures/content')` and `resolve(import.meta.dirname, '..')`
- **When** the guard runs
- **Then** it reports nothing

#### S-3.2 — Functions not from `node:path`
- **Given** `resolve([layer])` imported from `src/resolver`
- **When** the guard runs
- **Then** it reports nothing

#### S-3.3 — `dirname` of a path inside a workspace
- **Given** `dirname(join(ws, 'a/b.txt'))`, and `dirname(root)` where this `root` comes from
  `join(makeTree({}), 'repo')` while another function of the same file declares a `root` from
  `makeTree`
- **When** the guard runs
- **Then** it reports nothing

<a id="fr4"></a>
### FR-4 — An exception allows one call, not a file
Serves: AC-2/C1
Projects: mandao

An exception names a file, the exact text of one call and the reason; it exempts only that call.

#### S-4.1 — Another call in the same file is still reported
- **Given** an exception for `dirname(makeTree({}))` in a file that also has `join(ws, '..')`
- **When** the guard runs
- **Then** it reports the `join` call and not the excepted one

<a id="fr5"></a>
### FR-5 — The guard runs over `test/` and the suite stays green
Serves: AC-3, AC-3/C1
Projects: mandao

#### S-5.1 — The current tree
- **Given** the tests on `main`, where the guard finds `join(root, f, '..')` in
  `test/integration/mdo-0005-defects.test.ts` and `dirname(makeTree({}))` in
  `test/unit/helpers.test.ts` ([P3](#p3))
- **When** the first is rewritten as `dirname(join(root, f))` and the second is the one exception
- **Then** the guard reports nothing and `npm test` passes
- **BUT it must NOT** change, skip or remove any existing assertion (C1)

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1, S-1.2, S-1.3; FR-2 / S-2.1, S-2.2 | covered |
| AC-1 | C1: today's shape | FR-1 / S-1.4 | covered |
| AC-2 | main | FR-3 / S-3.1, S-3.2, S-3.3 | covered |
| AC-2 | C1: one call, not a file | FR-4 / S-4.1 | covered |
| AC-3 | main | FR-5 / S-5.1 | covered |
| AC-3 | C1: no assertion weakened | FR-5 / S-5.1/C1 | covered |

## Decisions

<a id="d1"></a>
### D1 — Read the syntax tree with the TypeScript compiler API

- One single-file program per test file (`noResolve`, `noLib`) gives each identifier its own
  declaration, so a `root` from `makeTree` in one function does not taint another `root`
  (S-3.3). `typescript` is already a dev dependency ([P1](#p1)).
- Rejected: widening the regex (cannot see scopes, aliases or multi-line calls; a file-wide name match
  flagged `test/integration/scripts.test.ts:48` by mistake in the prototype). Rejected: a runtime check
  of the temp folder before and after the run (other processes write there, it cannot name a file or
  line, and MDO-0006 AC-1/C2 forbids touching what the run did not create).

<a id="d2"></a>
### D2 — Forbid every `..` segment rather than prove a path stays inside

- `join(ws, 'a', '..')` stays inside, but proving that needs the values of variable segments. A
  path that needs the parent of something inside a workspace uses `dirname(join(…))` instead.
- `import.meta.dirname` as first argument is exempt: those paths point into the repository
  (fixtures, the repo root), never at a workspace.
- Rejected: counting depth of literal segments (wrong as soon as one segment is a variable).

<a id="d3"></a>
### D3 — A pure detector in `test/guards.ts`, tested on snippets

- `findClimbs(file, source)` returns `{ line, text }` per offending call. Its own tests feed it one
  snippet per scenario, so every shape is proven even when the real tree has none of them.
  `test/unit/architecture.test.ts` runs it over `test/` and keeps the `files()` helper.
- Rejected: only the guard over the real tree (it cannot prove shapes that are absent today).

<a id="d4"></a>
### D4 — Exceptions name one call

- `ALLOWED` holds `{ file, call, why }`; a finding is exempt only when its file and exact call text
  match. One entry: `test/unit/helpers.test.ts`, `dirname(makeTree({}))`, because MDO-0006 S-2.1
  needs a look-alike folder next to a workspace and removes it in its own `finally`.
- Rejected: a per-file list like the `mkdtemp` guard's (it would hide any new climb in that file).

<a id="d5"></a>
### D5 — Replace the regex guard, rewrite the one legitimate climb

- The AST guard catches everything the regex did (S-1.4), so the regex test goes. The `mkdtemp` /
  `tmpdir` guard stays as it is.
- `test/integration/mdo-0005-defects.test.ts:266` becomes `mkdirSync(dirname(join(root, f)), …)`:
  the same folder, since `join` normalises `..` and every `f` there is a file path.

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `test/` | New `test/guards.ts` with `findClimbs` | `test/helpers.ts` |
| mandao | `test/unit` | New `guards.test.ts`, one test per scenario of FR-1 to FR-4 | `test/unit/helpers.test.ts` |
| mandao | `test/unit` | `architecture.test.ts`: the regex guard becomes the AST guard with `ALLOWED` | `test/unit/architecture.test.ts` |
| mandao | `test/integration` | `mdo-0005-defects.test.ts:266` uses `dirname(join(root, f))` | `test/integration/scripts.test.ts` |

## Risks and impacts

- Risk tags: none (test code only; nothing under `src/`, `core/` or the published package changes).
- A false positive blocks the suite; the snippet tests of FR-3 pin the known legitimate shapes, and a
  new one is handled by an `ALLOWED` entry with its reason.
- The guard's cost: about 0.2 s for all of `test/` in the prototype ([P3](#p3)).
- **Constitution Impact (proposal; /mandao-close applies it):** `docs/constitution/standards.md:23-25`
  says tests "never write next to a workspace through `join(<folder>, '..', …)`". Proposed: "never
  build a path with a `..` segment through `join` or `resolve`, nor take `dirname` of a workspace,
  except calls named in the guard's `ALLOWED` list".
- Product Impact: none. Module Docs Impact: none.

## Consistency Check

No findings.

## Open items

- ASSUMPTION(source: story.md#assumptions): scope is the four shapes; the others are listed as out of
  scope in the story.

## Clarifications

None.

## Premise Ledger

<a id="p1"></a>
### P1 — `typescript` is installed and exposes `createProgram` and `createSourceFile` (High)
If false: D1 needs a parser dependency, which needs approval. Evidence: [E1](#e1).

<a id="p2"></a>
### P2 — Today's guard misses the shapes AC-1 names (High)
If false: there is no gap and the story is moot. Evidence: [E2](#e2).

<a id="p3"></a>
### P3 — On `main`, the rules of D1–D2 flag exactly `mdo-0005-defects.test.ts:266` and `helpers.test.ts:15` (High)
If false: T2's rewrite list and `ALLOWED` change. Evidence: [E3](#e3).

## Tasks

### [x] T1 — A detector that reports every climbing path and leaves inside paths alone

- **What:** `findClimbs` in `test/guards.ts` with the rules of [D1](#d1) and [D2](#d2), and its
  snippet tests ([D3](#d3)).
- **Done when:**
  - S-1.1 to S-1.4 and S-2.1, S-2.2 hold: each snippet yields one finding with its line and text.
  - S-3.1 to S-3.3 hold: each snippet yields no finding.
  - The detector only reads the source it is given; it touches no file.

```yaml
project: mandao
kind: test
tier: standard
files: [test/guards.ts, test/unit/guards.test.ts]
exemplar: test/helpers.ts
ac: [AC-1, AC-1/C1, AC-2]
scenarios: [S-1.1, S-1.2, S-1.3, S-1.4, S-2.1, S-2.2, S-3.1, S-3.2, S-3.3]
test_levels: { S-1.1: unit, S-1.2: unit, S-1.3: unit, S-1.4: unit, S-2.1: unit, S-2.2: unit, S-3.1: unit, S-3.2: unit, S-3.3: unit }
evidence: tdd
risk_tags: []
depends_on: []
parallel_safe: false
verify: npx vitest run test/unit/guards.test.ts
```

### [x] T2 — The guard runs over every test with one named exception, and the suite stays green

- **What:** replace the regex test in `test/unit/architecture.test.ts` with one that runs
  `findClimbs` over `test/` and honours `ALLOWED` ([D4](#d4)); rewrite the one legitimate climb
  ([D5](#d5)).
- **Done when:**
  - Red first: before the rewrite, the guard names `mdo-0005-defects.test.ts:266` and
    `helpers.test.ts:15`.
  - S-4.1 holds: a snippet test where the excepted call and a `join(ws, '..')` share a file reports
    only the `join`.
  - S-5.1 holds: the guard reports nothing and `npm test` passes; S-5.1/C1: no assertion changed,
    skipped or removed.

```yaml
project: mandao
kind: test
tier: standard
files: [test/unit/architecture.test.ts, test/integration/mdo-0005-defects.test.ts, test/guards.ts, test/unit/guards.test.ts]
exemplar: test/unit/architecture.test.ts
ac: [AC-2/C1, AC-3, AC-3/C1]
scenarios: [S-4.1, S-5.1, S-5.1/C1]
test_levels: { S-4.1: unit, S-5.1: unit, S-5.1/C1: unit }
evidence: tdd
risk_tags: []
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/unit/architecture.test.ts test/unit/guards.test.ts test/integration/mdo-0005-defects.test.ts test/unit/helpers.test.ts
```

## Evidence

Recorded with `mandao run premise MDO-0007 <Pn>` (`_log/premises/`), commit 4e9e5fe. The probe
scripts live outside the repository; `scan.mjs` is a prototype of D1–D2.

<a id="e1"></a>
<details><summary>E1 — P1</summary>

`node ts-api.mjs <worktree>`, exit 0 (`_log/premises/P1.md`):

```
typescript 6.0.3 createProgram: function createSourceFile: function
```

</details>

<a id="e2"></a>
<details><summary>E2 — P2</summary>

`node regex.mjs`, the regex of `test/unit/architecture.test.ts:38` on sample calls, exit 0
(`_log/premises/P2.md`):

```
caught join(ws, '..', 'x')
MISSED join(ws, 'a', '..', '..')
MISSED join(ws, '../x')
MISSED resolve(ws, '..')
MISSED writeFileSync(join(dirname(ws), 'x'), '')
```

</details>

<a id="e3"></a>
<details><summary>E3 — P3</summary>

`node scan.mjs <worktree>`, the scope-aware prototype over `test/`, exit 0 (`_log/premises/P3.md`):

```
test/integration/mdo-0005-defects.test.ts:266 join: join(root, f, '..')
test/unit/helpers.test.ts:15 dirname: dirname(makeTree({}))
scan done in 224 ms
```

</details>

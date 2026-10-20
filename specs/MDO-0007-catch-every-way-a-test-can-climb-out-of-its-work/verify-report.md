---
schema_version: 1
spec: MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work
verdict: verified
date: 2026-10-20
---

# Verify — Catch every way a test can climb out of its workspace

Verified. Every AC clause has a passing unit test, the full suite passes (54 files, 401 tests), and a
probe file with the four AC-1 shapes made the real guard fail naming each line. No product bugs.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | no | `guards.test.ts` S-1.1, S-1.2, S-1.3 (×2), S-2.1, S-2.2; probe on the real guard | unit | pass |
| AC-1/C1 | no | `guards.test.ts` S-1.4; probe line `join(ws, '..')` | unit | pass |
| AC-2 | no | `guards.test.ts` S-3.1, S-3.2, S-3.3 (×2) | unit | pass |
| AC-2/C1 | no | `guards.test.ts` S-4.1 | unit | pass |
| AC-3 | no | `architecture.test.ts` "no test climbs out of its work folder"; full suite | unit | pass |
| AC-3/C1 | no | diff check of `test/` since approval | unit | pass |

### AC-1 — the real guard, not only snippets
A throwaway `test/unit/zz-probe.test.ts` with each shape made `architecture.test.ts` fail naming all
four lines; after deleting it the guard was green again and nothing was left behind ([E3](#e3)).

### AC-3/C1 — no assertion weakened
`git diff ef22ad1..HEAD -- test/` removes no `expect(` line and adds no `.skip`, `.only`, `.todo` or
`.fails`. The only removed test is the regex guard that D5 replaces; its successor keeps
`expect(offenders).toEqual([])`. In `mdo-0005-defects.test.ts` only a setup line changed
(`dirname(join(root, f))`), no assertion.

## Suites

| Project | Kind | Result |
|---|---|---|
| mandao | unit (impacted) | pass: 3 files, 26 tests; with `helpers.test.ts`, 4 files, 29 tests |
| mandao | unit (full, AC-3) | pass: 54 files, 401 tests |

No e2e suite: no AC is critical and no critical-flow suite changed. No rebuild of the CLI: the spec
changes only test code.

## TDD evidence (ADR 0022)

- `missingRed`: none. T1 and T2 each have a `RED` row in `_log/execution.md`.
- **T1, red test changed:** two snippets were built from `UP = '..'` after the red run, because the old
  regex guard flagged the literal text; T2 restored the literals. The Reviewer judged both edits to
  keep the same source under test and the same expected values.
- **T2, red test changed:** both red files were formatted with `biome format --write` after the red
  run, and the T1 literals were restored. Reviewer: not a weakening.
- **T2, partial red:** the red run was recorded after the exception and `withoutAllowed` were written
  (the Leader's brief ordered it so). It named only `mdo-0005-defects.test.ts:266`, and S-4.1 was
  never seen failing. That `helpers.test.ts:15` is flagged without the exception is shown by premise
  P3 (`spec.md#p3`).

## Product bugs

None.

## Deferred to CI

None.

## Blockers

None.

## Evidence

<a id="e1"></a>
<details><summary>E1 — impacted unit tests</summary>

`node .mandao/bin/mandao.mjs run tests mandao test/guards.ts test/integration/mdo-0005-defects.test.ts test/unit/architecture.test.ts test/unit/guards.test.ts`
→ PASS, 3 files, 26 tests.

`npx vitest run test/unit/architecture.test.ts test/unit/guards.test.ts test/integration/mdo-0005-defects.test.ts test/unit/helpers.test.ts`
→ 4 files, 29 tests passed.

</details>

<a id="e2"></a>
<details><summary>E2 — full suite</summary>

`nice -n 10 npx vitest run --maxWorkers=4`

```
 Test Files  54 passed (54)
      Tests  401 passed (401)
```

The stray `/bin/sh: mandao-no-such-command-xyz: command not found` line comes from a test that
runs an unknown command on purpose.

</details>

<a id="e3"></a>
<details><summary>E3 — AC-1 probe</summary>

`npx vitest run test/unit/architecture.test.ts` with `test/unit/zz-probe.test.ts` in place:

```
× no test climbs out of its work folder
+ "test/unit/zz-probe.test.ts:6 join(ws, 'a', '..', '..')",
+ "test/unit/zz-probe.test.ts:7 resolve(ws, '..')",
+ "test/unit/zz-probe.test.ts:8 dirname(ws)",
+ "test/unit/zz-probe.test.ts:9 join(ws, '..')",
```

After deleting the probe: 1 file, 3 tests passed; `git status` showed no leftover file.

</details>

## Consistency Check

No findings. The report agrees with story, spec and design: every AC clause maps to the scenarios of
the AC → FR matrix, and the built guard follows D1–D5. The proposed Constitution Impact
(`standards.md:23-25`) is still pending for /mandao-close.

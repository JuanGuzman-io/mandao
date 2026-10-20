---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
audience: developers
language: en
---

# Technical notes — Prove that a crashing doctor never sends garbage to CI

## What was built
- mandao · `test/integration/doctor-process.test.ts` (new, 76 lines): `beforeAll` bundles
  `src/cli/index.ts` with tsup's `build()` (`config: false`, same entry, format, target and platform as
  `tsup.config.ts`) into `mkdtemp(node_modules/.cache/mandao-cli-)`; each case runs
  `process.execPath <out>/cli.js doctor --json` with `spawnSync` in a `makeTree` workspace and an
  isolated `MANDAO_HOME`. Lock cases (S-1.1 broken YAML, S-1.2 schema-invalid): status 1, stdout
  exactly `''`, stderr matches `/\berror\b/` and contains `.mandao/mandao.lock`. Models cases (S-2.1,
  S-2.2): status 1, stderr exactly `''`, the whole stdout parses as a report with `schema_version: 1`
  and an `error` finding naming `.mandao/models.yml`. Commit 331b2d5 (Refs: MDO-0005, Mandao-Task: T1).
- mandao · `test/integration/doctor-cli.test.ts`: one comment line above the in-process S-2.2 test
  pointing to the process-level proof (D6). Same commit.
- No change under `src/`, `core/`, `docs/schemas.md` or `.github/`.

## Decisions and pivots
D1–D6 as designed (`design.md`). The main one, D1: build the CLI in the test with tsup rather than
spawn `dist/cli.js` (CI runs `npm test` before `npm run build`, P4), use Node type stripping (fails on
`.js` specifiers and `ConfigError`'s parameter property) or add `tsx` (new dependency). The bundle stays
inside the repository so `packageInfo()` finds `core/` (P5).

No pivots. One Reviewer FAIL on T1 attempt 1, passed on attempt 2; the FAIL reason is not recorded in
`execution.md` (Kaizen lesson 1).

Corrected premise (CC-1, C-1): MDO-0004 design P5 claimed an invalid `.mandao/models.yml` takes the
crash path. It does not: `buildProject` reads it inside the `try` in `runDoctor`, so it becomes an
`error` finding in the JSON report, exit 1, empty stderr. AC-2 was rewritten to prove that behavior.
The closed MDO-0004 documents (`story.md:49`, `design.md:69`) keep the wrong claim by decision.

TDD: the tests characterize existing behavior and could not be red. `execution.md` § Mutation evidence
records ten local mutations (M1–M10), each failing its targeted assertion, in place of red evidence.

Closes MDO-0004 follow-up CC-V1 (T2 · A1).

## Contract changes
None. The crash path of `src/cli/index.ts` (MDO-0004 S-2.2) is now tested, not changed.

## Diagram and drift
None. Lite depth, no new runtime flow; `design.md` § Diagram is intentionally empty, so `mandao run
diagram-drift MDO-0005` reports "design.md has no diagram with a structured graph" and there is no
approved graph to compare against. The commit touches only `test/`, so there is no built-flow node to
add either.

## How to test
- `npx vitest run test/integration/doctor-process.test.ts` — 4 tests, about 0.7 s including the bundle
  build (NFR-1 budget: 5 s).
- `npm test` runs it with the rest of the suite (`vitest.config.ts` includes `test/**/*.test.ts`).

Known limit: the path assertions use `join('.mandao', …)`; on Windows that is a backslash, and whether
the product prints the same separator there is unproven. Every CI job runs on `ubuntu-latest`.

## Links
- Spec: `specs/MDO-0005-prove-the-doctor-crash-path-end-to-end/`
- Parent: `specs/MDO-0004-doctor-findings-as-json-for-ci/` (verify CC-V1)
- Branch: `feat/MDO-0005-prove-the-doctor-crash-path-end-to-end`; no PR yet. No tracker.

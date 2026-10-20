---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
depth: lite
projects: [mandao]
status: approved
---

# Design — Leave no temporary folders behind after the test run

## Summary
No file under `src/` changes. `makeTree` (`test/helpers.ts`) records every folder it creates in a
module-level registry. A new vitest setup file, `test/setup.ts`, registered in `vitest.config.ts`
`setupFiles`, adds one `afterAll` that removes exactly the registered folders (`rmSync` with
`recursive` and `force`) and empties the registry. Vitest runs that hook once per test file, after the
file's own hooks (P1), whether its tests passed or failed (P2), with a registry per file (P3). It does
**not** run for a file that fails while loading (P4); the PO accepted that as best effort, like an
abrupt crash (CC-1, resolved in `requirements.md` Clarifications). `test/unit/commitlint.test.ts` switches
to `makeTree`. A guard test in `test/unit/architecture.test.ts` fails the suite when a file under
`test/` other than `test/helpers.ts` creates a temporary folder directly, or climbs out of a folder
with `join(<folder>, '..', …)` (D4). Two tests that wrote next to their workspace now keep those files
inside it (D7; P5 as corrected at verify).

## Premise Ledger

Evidence as run on `90b3307` with a throwaway probe in the git-ignored `node_modules/.cache/mdo6-probe/`
(vitest 5.0.5, the worktree's own install). The probe had a registry helper, a setup file with
`afterAll` that removed the registered folders, and three test files: `a` (a module-level workspace,
an own `afterAll` that checks it, one passing and one failing test), `b` (one test), and `c` (calls
the helper, then throws at module level). The folders went to a sandbox under `node_modules/.cache/`
instead of `os.tmpdir()`, because only hook order and isolation were under test. The command was
`npx vitest run --config node_modules/.cache/mdo6-probe/vitest.config.ts --maxWorkers 2
--disableConsoleIntercept`, which exited 1 because of the deliberate failures. Anything else was read
at source at the same SHA.

| # | Claim | Evidence (as run, SHA) or UNVERIFIED | If false | Impact |
|---|---|---|---|---|
| P1 | An `afterAll` registered by a `setupFiles` file runs once per test file, **after** that file's own `afterAll` | As run (`90b3307`): output order `FILE-A-AFTERALL top-exists=true` then `SETUP-AFTERALL size=3`, and likewise `FILE-B-AFTERALL` then `SETUP-AFTERALL size=1` | Workspaces vanish before the file's own teardown (AC-2/C1); D1 needs another hook point | High |
| P2 | That `afterAll` also runs when a test in the file fails | As run (`90b3307`): `a.test.ts` had `× fails on purpose`, and its setup hook still printed `removed=qmv7yx,Ogg6ww,0AU4gM` (module-level, passing test and failing test workspaces) | AC-1/C1 is not met for failing tests | High |
| P3 | Each test file gets its own instance of the helper module, so the registry holds only that file's folders | As run (`90b3307`): `FILE-B-AFTERALL registry-size=1` while `a` registered 3, and the two files ran in different workers (pids 63844 and 63843). The project `vitest.config.ts` sets no `pool` or `isolate` override (read at source) | One file's cleanup could remove another file's live workspaces when files share a worker (AC-2) | High |
| P4 | A test file that fails **while loading** (a throw at module level, after it called the helper) never runs the setup `afterAll`, so its folder stays | As run (`90b3307`): `FAIL c.test.ts … module-level failure after makeTree`, no `SETUP-AFTERALL` line for it, and `ls node_modules/.cache/mdo6-tmp` showed exactly one folder left (`mdo6-probe-5n1q7u`), not in any `removed=` list | — (confirmed; it is a limit of D1 and the source of CC-1) | High |
| P5 | `makeTree` (`test/helpers.ts:7`, prefix `mandao-test-`) and `test/unit/commitlint.test.ts:40` (prefix `mandao-cl-`) are the only places in `test/` that create folders in `os.tmpdir()`. `test/integration/doctor-process.test.ts:17` creates its folder in `node_modules/.cache/` and removes it at `:30-32` | Search at source (`90b3307`): `mkdtemp\|tmpdir` over `test/` matched only those three files. **FALSE as run at verify** (`d9a8305`, D6 green run with a dedicated `TMPDIR`, `verify-report.md` PB-1, PB-2): the run also left `mandao-test-<id>.worktrees/PROJ-12-fix-login/` and three `*.patch` files. `test/integration/scripts.test.ts:44-49` runs `git worktree add` at `join(root, '..', '<root>.worktrees', …)` (the product puts worktrees next to the repository), and `test/integration/characterization.test.ts:74` writes `join(root, '..', '<n>.patch')`. Neither line contains `mkdtemp` or `tmpdir`, so the search could not see them. **Corrected premise**: a test leaks into the temp folder either by creating a folder there directly or by writing next to a `makeTree` workspace through `join(<folder>, '..', …)`. Search at source (`d9a8305`): `join(<x>, '..'` with `<x>` other than `import.meta.dirname` matches only those two lines under `test/`; `join(root, f, '..')` in `mdo-0005-defects.test.ts:263` stays inside the workspace and does not match the guard's shape | It happened: AC-1 failed at verify (CC-V1); D4 is widened and D7 added | High |
| P6 | No code under `src/` creates temporary folders | Search at source (`90b3307`): `mkdtemp\|tmpdir` over `src/`, no matches | Product code is in scope after all (story, Out of scope) | Low |
| P7 | No test makes a workspace folder unremovable | Search at source (`90b3307`): the only `chmodSync` calls set `0o755` on files (`ledger.test.ts:120`, `launcher.test.ts:48`, `review.test.ts:73`, `engine.test.ts:180`) | `rmSync` throws in `afterAll` and that file fails | Low |

## Diagram
<!-- Lite depth: `mandao run diagram MDO-0006` says optional. No new runtime flow; none is drawn. -->

## Decisions

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | `makeTree` adds each folder it creates to an exported `Set<string>` in `test/helpers.ts`. A setup file `test/setup.ts`, listed in `vitest.config.ts` `test.setupFiles`, registers `afterAll(removeTrees)`. `removeTrees()` (exported from `test/helpers.ts`) runs `rmSync(dir, { recursive: true, force: true })` for each registered folder and then clears the set | (a) An `afterAll` in every test file: fails AC-3 (new tests must add nothing). (b) `onTestFinished` per test: removes module-level and `beforeAll` workspaces that later tests still use (fails AC-2, S-3.2). (c) A `globalSetup` teardown that deletes `tmpdir()/mandao-test-*`: removes folders this run did not create, such as a concurrent run's or ones left by earlier runs (fails AC-1/C2). (d) Point `TMPDIR` at a per-run folder from `globalSetup` and delete it at the end: it changes the temp folder of every child process the tests start (git, nested vitest in `tdd.test.ts`), which risks AC-4, and cleanup would only happen at the end of the whole run | Exact paths satisfy AC-1/C2 by construction. The hook runs per file, after the file's own hooks (P1), on pass and on fail (P2), and each file has its own registry (P3). Limit: a file that fails while loading leaks its module-level folders (P4; accepted as best effort in CC-1). Contributors keep calling `makeTree` as they do today (AC-3) |
| D2 | `force: true` on `rmSync` | Plain `rmSync`, or check `existsSync` first | A test that removed its own workspace must not fail the file (S-2.2). `force` only ignores a missing path; it still raises other errors such as permissions |
| D3 | `test/unit/commitlint.test.ts`: replace `mkdtempSync(join(tmpdir(), 'mandao-cl-'))` with `makeTree({})`, and drop the now-unused `mkdtempSync`/`tmpdir` imports. Every assertion stays as it is | Its own `afterAll` with `rmSync` | One cleanup path for everything. The guard (D4) then allows only `test/helpers.ts` plus one documented exception |
| D4 | Guard test `only test/helpers.ts creates temporary folders` in `test/unit/architecture.test.ts`. It walks `test/` recursively (reusing the file's `files()` helper) and fails when a file other than `test/helpers.ts` matches `/\bmkdtemp(Sync)?\b|\btmpdir\b/`. `ALLOWED` holds one entry, `test/integration/doctor-process.test.ts`, with its reason in a comment (its folder is under `node_modules/.cache/` and it removes it itself). The guard excludes its own file from the scan, since it necessarily contains the pattern. **Widened after verify (CC-V2)**: the same guard, or a sibling test next to it, also fails naming every file under `test/` that matches `join(<x>, '..'` where `<x>` is a single argument other than `import.meta.dirname` (a regex such as `/\bjoin\((?!import\.meta\.dirname\b)[^,()]+,\s*['"`]\.\.['"`]/`). Paths from `import.meta.dirname` point into the repository (fixtures, `core/`), not the temp folder | A Biome lint rule (no rule restricts calls by path); a new test file | Story, confirmed at approval: "in the spirit of the existing architecture guard". It has the same shape as `only src/writer writes to the filesystem`, so readers find both in one place |
| D5 | Prove the mechanism with a dedicated test file, `test/unit/helpers.test.ts`. (1) `makeTree` registers its folder and `removeTrees()` removes it (S-1.1). (2) A folder named `mandao-test-…` created without `makeTree` survives `removeTrees()` (S-2.1); the test then removes it itself. (3) A workspace the test already removed does not make `removeTrees()` throw, and the remaining ones are still removed (S-2.2). (4) A module-level workspace still exists in this file's own `afterAll` (S-3.1) | Rely only on the full-run check (S-1.4) | Unit-level proof of the rules and edge clauses (test policy: "Always" for edge cases). S-1.2 and S-1.4 rest on vitest behavior (P1, P2), which a test cannot fail from inside itself, so `/mandao-verify` proves them with the full-run check in D6 |
| D6 | Verify-time check for AC-1 (S-1.4, S-1.2): run `npm test` with `TMPDIR` set to a fresh empty folder seeded with one sentinel `mandao-test-sentinel/` folder. Run it once as is and once with one test made to fail temporarily (reverted afterwards). After each run the folder must hold only the sentinel | A permanent test that spawns the whole suite: slow, recursive, and outside the budget | It measures the observable outcome of AC-1 as written, including C1 and C2, without adding a recursive run to the suite |
| D7 | Tests keep what they write inside a `makeTree` workspace (CC-V1). `scripts.test.ts`: `repoWithSpec()` creates the git repository in a `repo/` subfolder of the workspace, so the worktree the product places next to the repository (`<repo>.worktrees/…`) is inside the workspace too; the worktree assertion compares against `join(dirname(root), 'repo.worktrees', 'PROJ-12-fix-login')`, a path with no `..`. `characterization.test.ts`: `patch()` writes its file into its own `makeTree({})` workspace, not the repository, so the repository's `git status` assertions are unaffected | (a) Register the leaked paths for removal (`trees.add`): it keeps the escape and the guard (D4) would have to allow it. (b) Remove them in each test's own `afterAll`: fails AC-3 | One cleanup path; the guard needs no new exception. What each test asserts does not change: the worktree path is still the product's "next to the repository" rule, now stated without `..` |

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `test/` helpers | `makeTree` registers each folder; new exported `removeTrees()` | `test/helpers.ts` (itself) |
| mandao | `test/` setup | New `test/setup.ts` with one `afterAll(removeTrees)` | `test/helpers.ts` (module style); `test/integration/doctor-process.test.ts:30-32` (an `afterAll` with `rmSync` and `force`) |
| mandao | build config | `vitest.config.ts`: `setupFiles: ['test/setup.ts']` | `vitest.config.ts` (itself) |
| mandao | `test/unit` | `commitlint.test.ts` uses `makeTree` (D3) | `test/unit/launcher.test.ts:11` (`makeTree` for files the test then imports or runs) |
| mandao | `test/unit` | Guard test in `architecture.test.ts` (D4) | `test/unit/architecture.test.ts:9-17` |
| mandao | `test/integration` | `scripts.test.ts` and `characterization.test.ts` keep the worktree and the patch files inside a workspace (D7) | `test/unit/launcher.test.ts:11` |
| mandao | `test/unit` | New `helpers.test.ts` (D5) | `test/unit/workspace.test.ts` (unit test over `makeTree` trees) |

The four critical-flow suites (`engine.test.ts`, `doctor-cli.test.ts`, `writer.test.ts`,
`content.test.ts`) are not edited (FR-6).

## Risks and risk tags

No risk tags apply. Nothing changes in auth, input, PII, payments, migration, public API, infra, AI
prompts, UI or performance of the product.

- **Cleanup that removes too much.** `rmSync` on a wrong path could delete files outside the temp
  folder. The design limits it to paths that `mkdtempSync(join(tmpdir(), 'mandao-test-'))` returned
  in the same process (D1); S-2.1 proves a look-alike folder survives.
- **Cleanup too early.** Covered by P1 (hook order, as run) and S-3.1.
- **A file that fails while loading leaks its folders** (P4, as run). Accepted by the PO
  on 2026-10-20 (CC-1, option a): treated like an abrupt crash, best effort, out of scope for AC-1.
  The runner still reports the file as failed, so the leak is never silent.
- **A test leaves a folder it cannot remove** (for example after `chmod` without write permission).
  Today's `chmodSync` calls only set `0o755` on files (`ledger.test.ts:120`, `launcher.test.ts:48`,
  `review.test.ts:73`, `engine.test.ts:180`), so the folders stay removable. If one ever fails,
  `rmSync` throws in `afterAll` and the file fails visibly rather than silently.

## Constitution Impact
<!-- Proposed changes to docs/constitution/*. Applied only by /mandao-close, with approval. -->

- `docs/constitution/standards.md`, under testing conventions: "Tests create temporary folders only
  through `makeTree` (`test/helpers.ts`), which removes them when the test file finishes. Enforced by
  `test/unit/architecture.test.ts`."

## Product Impact
<!-- Changes to product.md, business-rules.md, glossary.md. Applied only by /mandao-close. -->

None. This is developer experience only.

## Module Docs Impact
<!-- AGENTS.md files to create or update, per module. -->

- The `codebase-conventions` project skill (`.claude/skills/codebase-conventions/`), under its test
  conventions: add the same rule as the Constitution Impact, so agents writing tests use `makeTree`
  instead of `mkdtempSync`. No module `AGENTS.md` covers `test/` today, so none is created.

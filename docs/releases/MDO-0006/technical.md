---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
audience: developers
language: en
---

# Technical notes — Leave no temporary folders behind after the test run

## What was built
Nothing under `src/`, `core/` or `.github/` changed. Every change is test infrastructure (9 files, +103/−8).

- mandao · `test/helpers.ts`:
  - `makeTree` adds each folder it creates to an exported `trees: Set<string>`.
  - The new `removeTrees()` runs `rmSync(dir, { recursive: true, force: true })` on each registered
    folder, then clears the set. It never selects folders by name or prefix.
  - Commit 76e6745 (Mandao-Task: T1).
- mandao · `test/setup.ts` (new): a single `afterAll(removeTrees)`. It is registered in
  `vitest.config.ts` `test.setupFiles`. Same commit.
- mandao · `test/unit/helpers.test.ts` and `test/unit/helpers-teardown.test.ts` (new) prove:
  - a folder is removed (S-1.1);
  - a look-alike folder survives (S-2.1);
  - a folder the test already removed does not make the cleanup throw (S-2.2);
  - a module-level workspace still exists in the file's own `afterAll` (S-3.1, S-3.2).

  Same commit.
- mandao · `test/unit/commitlint.test.ts` uses `makeTree({})` in place of `mkdtempSync`. No assertion
  changed. Commit d9a8305 (T2).
- mandao · `test/unit/architecture.test.ts` gets two guards:
  - "only test/helpers.ts creates temporary folders" (T2, d9a8305). It flags `mkdtemp`, `mkdtempSync`
    and `tmpdir` outside `test/helpers.ts`, with one allowed file: `doctor-process.test.ts`.
  - "no test climbs out of a folder with join(<folder>, '..')" (T3, 87d380e).
- mandao · `test/integration/scripts.test.ts` builds its git repository in a `repo/` subfolder, so the
  product's `<repo>.worktrees/` stays inside the workspace. The worktree assertion is now
  `join(dirname(root), 'repo.worktrees', 'PROJ-12-fix-login')`. Commit 87d380e (T3).
- mandao · `test/integration/characterization.test.ts`: `patch()` writes into its own `makeTree({})`
  workspace instead of next to the repository. Same commit.

## Decisions and pivots
D1–D7 are recorded in `design.md`:

- **D1:** one exact-path registry with a setup-file `afterAll`.
  - It runs per test file, after the file's own hooks (P1), on pass and on fail (P2), with a registry
    per file (P3). All three were checked as run with a probe.
  - Rejected: a `globalSetup` prefix sweep (fails AC-1/C2) and a per-run `TMPDIR` (risks AC-4).
- **D7**, added after the first verify: tests keep what they write inside the workspace. Registering
  the leaked paths for removal would have kept the escape.

There were no task pivots, but the first verify (d9a8305) blocked:

- **PB-1:** a `.worktrees` folder was left in the temp folder.
- **PB-2:** `.patch` files were left in the temp folder.
- **CC-V1:** premise P5 was false.
- **CC-V2:** the guard had a gap.

The clarification widened FR-5 (S-5.1/C2) and added T3. The second verify on 87d380e passed. See
`verify-report.md` History.

Known limits:
- **A test file that fails while loading leaks its module-level folders.** The setup `afterAll`
  never runs for it (P4). The PO accepted this as best effort (CC-1). The runner still reports the
  file as failed.
- **The `join(…, '..')` guard matches text in one shape only.** It misses `join(a, b, '..')`,
  `resolve(x, '..')` and `dirname(makeTree(…))`. The full guarantee of AC-1 is the D6 run, which is
  manual today. Kaizen proposes it as a CI step.
- **AC-2/C1 relies on vitest's default `sequence.hooks: 'stack'`.** Kaizen proposes pinning it.
- **The guards compare `/`-separated paths**, the same assumption as the existing writer guard
  (Windows is not covered).

Open item: the approved edit to the `codebase-conventions` project skill (§ Tests: no
`mkdtempSync`/`tmpdir()` and no writes outside the workspace) was not applied. Writing
`.claude/skills/` was denied by the permission system during close, so the maintainer applies it by
hand. The same rule is in `docs/constitution/standards.md` § Conventions.

## Contract changes
None. The only interface change is in test code: `test/helpers.ts` now also exports `trees` and
`removeTrees`. The signature of `makeTree` is unchanged.

## Diagram and drift
None. The spec is at lite depth with no new runtime flow, and `design.md` § Diagram is intentionally
empty. `mandao run diagram-drift MDO-0006` reports "design.md has no diagram with a structured graph",
so there is no approved graph to compare against, and the commits touch only `test/` and
`vitest.config.ts`.

## How to test
- `npx vitest run test/unit/helpers.test.ts test/unit/helpers-teardown.test.ts test/unit/architecture.test.ts`
- Full outcome check (D6):
  1. Set `D=$(mktemp -d)`.
  2. Run `mkdir -p "$D/mandao-test-sentinel" && touch "$D/mandao-test-sentinel/keep.txt"`.
  3. Run `TMPDIR="$D" npm test`.
  4. Run `ls "$D"`. It must list only `mandao-test-sentinel/` and `node-compile-cache/`.
- To check the failing case, repeat the full check with a temporary failing test file, then delete
  that file.

## Links
- Spec: `specs/MDO-0006-leave-no-temporary-folders-behind-after-the-test/`
- Origin: `specs/quick/quick-log.md:10` (`restore-mandao-home`, Reviewer advisory).
- Branch: `feat/MDO-0006-leave-no-temporary-folders-behind-after-the-test`. There is no PR yet and no
  tracker.
- Not in scope: folders left by past runs. Remove them by hand, once, with
  `find "${TMPDIR:-/tmp}" -maxdepth 1 -name 'mandao-*' -mtime +1`, then delete what it lists.

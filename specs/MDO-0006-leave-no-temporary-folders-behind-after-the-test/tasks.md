---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
status: approved
---

# Tasks — Leave no temporary folders behind after the test run

<!--
The code graph (graphify-out/graph.json) only holds the spec documents of this worktree, so files and
modules come from design.md § Changes by project and module, checked at source on e473ec6:
`mkdtemp|tmpdir` over test/ matches only test/helpers.ts, test/unit/commitlint.test.ts and
test/integration/doctor-process.test.ts (design P5, now confirmed at source); over src/, none (P6).
Test-infrastructure spec: no change under src/, core/ or docs/. test/ has no AGENTS.md (design § Module
Docs Impact), so no module guide is due; the constitution and codebase-conventions skill impacts are
applied at /mandao-close.

Kinds follow `mandao run commit` (src/spec/commit.ts): T1 touches vitest.config.ts, which is not a test
file, so it is `chore` (test infrastructure); T2 only touches files under test/, so it is `test`.

ASSUMPTION (design D5 vs D1, found while planning): a `removeTrees()` call inside a test removes every
folder registered so far in that file, including a module-level one. So the S-3.1 proof (a
module-level workspace still exists in the file's own afterAll) cannot share a file with the tests that
call `removeTrees()`. T1 puts it in its own file, test/unit/helpers-teardown.test.ts. The Leader
confirms or overrides at /mandao-implement.

ASSUMPTION (design D4 vs D5): the S-2.1 test needs a look-alike `mandao-test-…` folder in the temp
folder created without makeTree, but the guard (T2) forbids `mkdtemp`/`tmpdir` outside
test/helpers.ts. The test creates it with `mkdirSync(join(dirname(makeTree({})), 'mandao-test-…'))`:
the parent of a makeTree workspace is the temp folder, and no forbidden token appears. No guard
exception is added for it.

S-1.2, S-1.2/C1, S-1.4 and S-1.4/C1 rest on vitest behavior (design P1, P2) that a test cannot fail
from inside itself; /mandao-verify proves them with the full-run check of design D6 (TMPDIR set to a
fresh folder seeded with a sentinel, once green, once with a test made to fail temporarily).

Added after /mandao-verify blocked the spec (verify-report.md, CC-V1 and CC-V2), on d9a8305: the
P5 search above missed two tests that write next to their workspace through `join(root, '..', …)`,
scripts.test.ts:44-49 (a git worktree) and characterization.test.ts:74 (patch files). design.md
records the corrected premise (P5) and D7; requirements.md widens FR-5 (S-5.1/C2). T1 and T2 stay
done. T3 only touches files under test/, so it is `test`. Its guard regex was checked at source on
d9a8305: over test/ it matches exactly those two files.
-->

### [x] T1 — Remove every `makeTree` workspace when its test file finishes

```yaml
project: mandao
kind: chore
tier: standard
files: [test/helpers.ts, test/setup.ts, vitest.config.ts, test/unit/helpers.test.ts, test/unit/helpers-teardown.test.ts]
exemplar: test/integration/doctor-process.test.ts
risk_tags: []
ac: [AC-1, AC-1/C1, AC-1/C2, AC-2, AC-2/C1, AC-3, AC-4, AC-4/C1]
scenarios: [S-1.1, S-1.2, S-1.2/C1, S-1.3, S-1.4, S-1.4/C1, S-2.1, S-2.1/C1, S-2.2, S-2.2/C1, S-3.1, S-3.1/C1, S-3.2, S-6.1, S-6.1/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: ["S-1.1: a folder from makeTree is gone after removeTrees() (helpers.test.ts)", "S-2.1 and S-2.1/C1: a mandao-test-… folder created next to a makeTree workspace without makeTree survives removeTrees() with its content intact; the test removes it itself (helpers.test.ts)", "S-2.2 and S-2.2/C1: after a test deletes one of two registered workspaces removeTrees() does not throw and the other one is gone (helpers.test.ts)", "S-3.1 and S-3.1/C1: a workspace created at module level still exists and holds what a test wrote into it inside the file's own afterAll (helpers-teardown.test.ts)", "S-3.2: a module-level workspace written by the first test is intact in the second test (helpers-teardown.test.ts)"], e2e: ["S-6.1 and AC-4: engine.test.ts, doctor-cli.test.ts, writer.test.ts and content.test.ts pass unchanged with the setup file active"] }
dod: ["red first: helpers.test.ts and helpers-teardown.test.ts written from the scenarios and recorded with mandao run red before removeTrees exists", "makeTree adds each folder it creates to an exported Set<string> in test/helpers.ts; makeTree's signature and its callers are unchanged (S-1.3)", "removeTrees() exported from test/helpers.ts runs rmSync(dir, { recursive: true, force: true }) on each registered folder, then clears the set; it never selects folders by name or prefix and never touches the temp folder itself (D1, D2, FR-2)", "test/setup.ts registers one afterAll(removeTrees) and nothing else", "vitest.config.ts adds test.setupFiles: ['test/setup.ts'] and no pool or isolate override (P3)", "the S-2.1 look-alike folder is created with mkdirSync under dirname(makeTree({})) so no mkdtemp or tmpdir token appears outside test/helpers.ts (see ASSUMPTION above)", "no change to engine.test.ts, doctor-cli.test.ts, writer.test.ts or content.test.ts; no .skip, .only, .todo or .fails added and no assertion removed or weakened under test/ (S-6.1/C1)", "no change under src/, core/ or docs/", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/unit/helpers.test.ts test/unit/helpers-teardown.test.ts test/integration/engine.test.ts test/integration/doctor-cli.test.ts test/unit/writer.test.ts test/unit/content.test.ts
depends_on: []
parallel_safe: false
characterization: false
```

### [x] T2 — Guard against temp folders created outside `makeTree`, and move commitlint onto it

```yaml
project: mandao
kind: test
tier: fast
files: [test/unit/architecture.test.ts, test/unit/commitlint.test.ts]
exemplar: test/unit/architecture.test.ts
risk_tags: []
ac: [AC-1, AC-3, AC-3/C1, AC-4, AC-4/C1]
scenarios: [S-4.1, S-5.1, S-5.1/C1, S-5.2, S-6.1, S-6.1/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: ["S-5.1 and S-5.1/C1: the guard 'only test/helpers.ts creates temporary folders' walks test/ recursively and fails naming every file other than test/helpers.ts that matches /\\bmkdtemp(Sync)?\\b|\\btmpdir\\b/ (red: it names test/unit/commitlint.test.ts before the switch)", "S-5.2: with commitlint on makeTree the guard passes; the only matches are test/helpers.ts and the allowed exception", "S-4.1: every existing commitlint assertion still runs and passes unchanged"], e2e: [] }
dod: ["red first: the guard is added and recorded with mandao run red while commitlint.test.ts still calls mkdtempSync, and its failure output names that file", "the guard reuses the file's files() helper, excludes architecture.test.ts itself from the scan, and keeps an ALLOWED list with exactly test/integration/doctor-process.test.ts and a comment giving the reason: its folder is under node_modules/.cache/ and it removes it in its own afterAll (D4)", "commitlint.test.ts creates the folder for commitlint.config.mjs with makeTree({}) and drops the unused mkdtempSync and tmpdir imports; no assertion changes (D3)", "no change to the four critical-flow suites; no .skip, .only, .todo or .fails added (S-6.1/C1)", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/unit/architecture.test.ts test/unit/commitlint.test.ts test/unit/helpers.test.ts
depends_on: [T1]
parallel_safe: false
characterization: false
```

### [x] T3 — Keep worktrees and patch files inside the workspace, and guard against `join(…, '..')`

```yaml
project: mandao
kind: test
tier: standard
files: [test/unit/architecture.test.ts, test/integration/scripts.test.ts, test/integration/characterization.test.ts]
exemplar: test/unit/architecture.test.ts
risk_tags: []
ac: [AC-1, AC-3, AC-3/C1, AC-4, AC-4/C1]
scenarios: [S-1.4, S-5.1, S-5.1/C1, S-5.1/C2, S-5.2, S-6.1, S-6.1/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: ["S-5.1/C2: the guard fails naming every file under test/ that matches join(<x>, '..' with <x> other than import.meta.dirname (red: it names test/integration/scripts.test.ts and test/integration/characterization.test.ts before the fix)", "S-5.2: after the fix the guard passes; paths from import.meta.dirname and join(root, f, '..') in mdo-0005-defects.test.ts are not flagged"], integration: ["S-1.4: scripts.test.ts and characterization.test.ts pass with every existing assertion; the worktree and the patch files are created inside a makeTree workspace"], e2e: ["S-6.1 and AC-4: engine.test.ts, doctor-cli.test.ts, writer.test.ts and content.test.ts pass unchanged"] }
dod: ["red first: the widened guard is added and recorded with mandao run red while scripts.test.ts and characterization.test.ts still use join(root, '..', …), and its failure output names both files; this adds a T3 red_tests entry for architecture.test.ts next to T2's", "the guard matches /\\bjoin\\((?!import\\.meta\\.dirname\\b)[^,()]+,\\s*['\"`]\\.\\.['\"`]/ (design D4 as widened), reuses files(), excludes architecture.test.ts itself and adds no ALLOWED entry for it", "scripts.test.ts: repoWithSpec() creates the repository in a repo/ subfolder of a makeTree workspace; the worktree test asserts p.worktree equals join(dirname(root), 'repo.worktrees', 'PROJ-12-fix-login') and keeps every other assertion (D7)", "characterization.test.ts: patch() writes its file into its own makeTree({}) workspace, not the repository and not next to it; no assertion changes (D7)", "no .skip, .only, .todo or .fails added and no assertion removed or weakened; no change to the four critical-flow suites (S-6.1/C1)", "no change under src/, core/ or docs/", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/unit/architecture.test.ts test/integration/scripts.test.ts test/integration/characterization.test.ts test/integration/engine.test.ts test/integration/doctor-cli.test.ts test/unit/writer.test.ts test/unit/content.test.ts
depends_on: [T2]
parallel_safe: false
characterization: false
```

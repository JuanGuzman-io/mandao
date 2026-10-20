---
schema_version: 1
spec: MDO-0006-leave-no-temporary-folders-behind-after-the-test
audience: product owner
language: en
---

# Release notes — Leave no temporary folders behind after the test run

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 — A full run leaves the temp folder as it found it | met | A full test run no longer leaves hundreds of throwaway folders in the computer's temp folder (before this change, about 550 per run, about 80 MB). This holds when tests fail too, and nothing the run did not create is touched. |
| AC-2 — Workspaces stay available while a test uses them | met | Each test keeps its workspace until its test file has finished, including that file's own setup and teardown. |
| AC-3 — New tests are covered without extra effort | met | Contributors who use the shared helper get cleanup for free. The test suite fails if a test creates a temp folder some other way, or writes outside its workspace by stepping up to the parent folder (`..`). |
| AC-4 — Existing coverage is unchanged | met | The suites that prove the critical flows were not edited and still pass. No check was removed or weakened. |

No change for Mandao users: this release only affects how the project's own tests run.

## Not done yet
- Folders left by earlier runs are not removed automatically. Delete them by hand once (the
  technical notes give the command).

## Known limits
- A test file that crashes while it loads may still leave its folders behind. The run reports that
  file as failed, so the leftovers are not silent.
- A test that writes outside its workspace in an unusual way can still slip past the automatic check.
  A full-run check that would catch every case is proposed for CI, but it is not in place yet.

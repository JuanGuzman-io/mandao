---
schema_version: 1
spec: MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work
audience: product owner
language: en
---

# Release notes — Catch every way a test can climb out of its workspace

The test suite now fails, naming the file and line, whenever a test builds a path that leaves its
temporary workspace, in any of the shapes that leaked before, so the temp-folder leaks fixed in
MDO-0006 cannot come back in another form.

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 | met | Every climbing shape the Reviewer named, and the one guarded before, fails the suite with its file and line |
| AC-2 | met | Paths that stay inside pass; the single deliberate exception allows one call and says why |
| AC-3 | met | The whole suite passes with no existing check weakened |

## Not done yet

Nothing.

## Known limits

- Paths built by joining text by hand, or a few rarer forms of the path functions, are not checked;
  the technical notes list them.
- Developer experience only; nothing changes for Mandao's users.

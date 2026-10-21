# Review of T2 in MDO-0009, attempt 2 (rework after the attempt-1 FAIL)

Both blocking findings from attempt 1 are fixed. The cleanup after a failed copy can only remove folders that did not exist when the call started, and no regression was found. What remains is advisory.

## Evidence
Tests: _log/gates/T2-2.md shows 59 files, 513 tests passed; NOT_INSTALLED label is the same mislabel as attempt 1. Full suite (65 files, 538 tests) is the implementer's report. format, lint, typecheck, build, metrics, scan-markers PASS; secrets and SAST NOT_INSTALLED. TDD: redTests.files lists test/unit/git-copy.test.ts and redTests.changed does not; the two changed files are the attempt-1 fixes already judged not weakened; skills.test.ts blob unchanged since attempt 1.

## Finding 1 (an error during the copy crashed init): fixed
copyPlan catches errors around copyFiles and returns failed with the error, the cleanup outcome and the manual step (AC-3/C1, S-3.3/C1); undoCopies catches its own errors. Cleanup safety: undoCopies only receives `fresh` targets (lstat found nothing at call start); pre-existing folders (including dangling symlinks) land in `existing` and are never cleaned; removeScratchDir(t.abs, root) refuses paths outside the workspace; kebabId ids and a fixed folder map keep targets inside; a fresh target never reached gets rmSync(force), a no-op. Only the lstat-to-copy window remains, negligible for a local single-user CLI. git-copy.test.ts covers a read-only .claude/skills: no throw, failed, permission error, manual step, no partial folder, nothing in temp, no pin; skipped as root.

## Finding 2 (an existing folder was pinned unverified): fixed
No new target, or an empty target list, gives pending with "already exists, not verified against commit …, left as is", the kept folders and the manual step; pinSkills only pins installed, so no pin (S-2.2, FR-2, D3; S-3.1/C1 still met). Mixed case still fetches, checks the commit and copies into the new target before pinning. Tests cover empty folders, a folder with other files, a target that is a file, no pin, nothing changed on disk.

## Advisory 3 (no timeout): addressed
timeout GIT_TIMEOUT_MS (120 s) and GIT_SSH_COMMAND='ssh -o BatchMode=yes' on each git call; ETIMEDOUT reported as "timed out after 120s" -> pending; a failure to start git is reported.

## Regressions
None found. docs/cli.md matches; src/skills/AGENTS.md accurate; removeScratchDir docstring lists all three uses.

## Advisory findings
1. [core/low] The undo of a half-written folder is not exercised (copy fails on the first target before any file is written). Fix: first target copied, second fails (.agents/skills read-only); assert .claude/skills/brainstorming removed and a pre-existing sibling survives.
2. [core/low] Empty parent folders (.agents/skills, .agents) created by mkdirSync(recursive) can be left behind after a failed copy. Harmless.
3. [core/low] makeScratchDir, realpathSync/readdirSync in planCopy and the finally removeScratchDir are outside any catch; only temp-folder faults. Fix: wrap copyGitSkill's body to return failed.
4. [security/low] GIT_SSH_COMMAND replaces a custom GIT_SSH_COMMAND or core.sshCommand; only ssh: URLs, shipped catalog uses https. Consider appending -o BatchMode=yes.
5. [core/low] Worst-case wait up to three git calls x 120 s per skill.
6. Carried over, non-blocking: http: and file: in the allow-list; SCRIPT_NOTES in code; no CLI-level test of skills add --with-scripts; OPEN: secrets and SAST never run on this security-lens task.

VERDICT: PASS

# Review of T2 in MDO-0009, attempt 1 (tier strong, risk tags infra and public-api, security lens)

Two blocking findings, both in src/skills/git-copy.ts: an error while copying files can crash init, which the spec forbids, and an existing folder is pinned in the lock with the catalog commit without being checked. The rest matches the spec; the git fetch and copy are hardened well and the tests are meaningful.

Evidence base: test gate labelled NOT_INSTALLED actually passed (58 files, 508 tests, _log/gates/T2-1.md). secrets and sast NOT_INSTALLED, so the security review is a manual reading of the diff. Code graph dependents (extensions.ts, setup.ts, git-copy.ts, skills-list.test.ts) all reviewed.

## Blocking findings

1. [core/medium] Filesystem errors during the copy crash init and leave a half-copied folder. git-copy.ts copyGitSkill -> copyPlan -> copyFiles -> copyNewFile: the try has only a finally; mkdirSync/copyFileSync throws (EACCES, ENOSPC, EEXIST from COPYFILE_EXCL on case-insensitive names) propagate through installSkills -> installAndPin -> offerSkills -> runInit, init exits 1, target <folder>/<id>/ half-written, lock not written. Breaks AC-3/C1 ("must NOT fail or block because a skill cannot be installed"), S-3.3/C1 ("init finish with exit code 0"), src/skills/AGENTS.md ("Neither throws"). Next run the partial folder counts as "already exists" (finding 2). Fix: catch around the copy phase, remove only targets this call created via a src/writer helper, return failed with error and manual step; unit test injecting a failure (read-only target parent) asserting failed, no partial folder, nothing left in temp.

2. [security/medium] A folder that merely exists is reported installed and pinned with the catalog commit without fetching or checking. git-copy.ts `if (!fresh.length) return { status: 'installed', detail: kept.join('; ') };` then pinSkills writes commit: s.source.commit. Only lstat on the path: empty folder, a file, an unrelated skill, an older version or the partial copy of finding 1 get pinned as bb92a77…; no SKILL.md check; with an empty harness list nothing is copied and it is still pinned. Breaks S-2.2 ("the lock pins it once verified"), FR-2 ("install, verify and pin"), D3 (rev-parse HEAD must equal commit; "Rejected: trusting the tag alone"). Implementer's own choice; S-3.1/C1 requires leaving the folder as is and saying so, not pinning it. Fix: when no target is new, require <folder>/<id>/SKILL.md to be a regular file in every kept folder, and either fetch and check the commit or pin without commit; otherwise report pending with "already exists, not verified", the kept folders and the manual step; unit test with an empty pre-existing folder asserting no pin with commit.

## Advisory findings

3. [security/medium] git runs with no timeout and ssh can prompt (spawnSync without timeout; GIT_TERMINAL_PROMPT=0 does not stop ssh host-key/passphrase prompts). Can hang init against AC-3/C1 "nor block". Fix: timeout, GIT_SSH_COMMAND='ssh -o BatchMode=yes', timeout -> pending with manual step.

4. [security/low] Allowed URL schemes include http: and file:. Pinned commit check limits risk. Fix: https:/ssh: in production, inject the allow-list for tests.

5. [core/low] SCRIPT_NOTES = { brainstorming: … } in git-copy.ts is catalog knowledge in code. Fix: optional catalog field (scripts_note).

6. [core/low] removeScratchDir docstring in src/writer/files.ts still says "(a spec's own _log/)"; gitRunner().ran in skills.test.ts is never asserted and cannot observe anything.

7. [security/low] OPEN: secrets and SAST did not run on a security-lens task; the pack's "Every configured gate passed" overstates it.

## Checklist

Spec conformance met apart from 1 and 2 (S-2.1/C1, AC-1/C1, S-2.3/C1, AC-1/C2, S-4.1, AC-2/C1, D2 installAndPin shared, D3 folder map, S-3.4/C1, S-3.5/C1). Fetch/copy security good: argument arrays, `--` before the URL, kebabId ids, path refusal plus realpath confinement, symlinks skipped, lstat + COPYFILE_EXCL, temp removal limited to tmpdir(), protocol.ext.allow=never. Changed red tests: none weakened (ASSUMPTION: RED snapshot not visible). Dropped tests: no scenario lost coverage; gap: no CLI-level test of `skills add --with-scripts` registration. Out-of-list changes justified except the early return of finding 2. Module docs updated. No boundary violation. TDD red evidence present.

VERDICT: FAIL

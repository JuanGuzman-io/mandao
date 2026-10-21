# Review of T3 in MDO-0009, attempt 2

Attempt 2 fixes the one blocking finding from attempt 1. Install's folder map is unchanged and no test changed. What's left is advisory.

## Blocking finding fixed
ALSO_READS is gone from src/engine/doctor-skills.ts; detection calls readableSkillFolders(h) from src/skills/install.ts, built from HARNESS_FOLDER, READS_SHARED and SHARED_FOLDERS, so the D3 map is in one place. Pure, with a one-line JSDoc (standards.md). Detection behaves exactly as before: claude .claude/skills; codex, antigravity .agents/skills; opencode .agents/skills, .claude/skills (duplicate removed); copilot .github/skills, .claude/skills, .agents/skills.

## No regression in install's folder map
The install.ts hunk only adds the function after SHARED_FOLDERS; skillFolders and the three constants untouched; installSkills copy targets the same. Copy targets and detection folders are different sets, as the implementer says.

## No test changed
doctor-skills.test.ts and engine.test.ts hunks byte-for-byte the same as attempt 1; redTests.changed is []; loop.tdd red true, evidence red.

Still holding: S-6.1, S-6.2, S-6.2/C1, graphify skipped, doctor runs no shell (existsSync only). src/skills/AGENTS.md describes readableSkillFolders and its difference from skillFolders.

Gates: everything configured passed; secrets and sast NOT_INSTALLED; audit SKIPPED.

## Findings (all advisory)
[core/low] task.files lists only the four original files; this attempt also edits src/skills/install.ts and src/skills/AGENTS.md (and docs/cli.md). Record the wider scope.
[core/low] No test calls readableSkillFolders directly; the OpenCode/Copilot shared-folder path is untested. Add readableSkillFolders('copilot') and a Copilot detection case.
[core/low] Carried over: REPORTED_AS_TOOLS duplicates a name from OPTIONAL_TOOLS; take the list from OPTIONAL_TOOLS when the test may be touched.
[core/low] Carried over: D4 "injectable runner" deviation not logged; no runDoctor-level test that graphify gives one finding; home folders assumed to mirror project folders (ASSUMPTION); .opencode/skills not checked; architecture.md diagram vs table on engine -> skills (OPEN, constitution fix).

VERDICT: PASS

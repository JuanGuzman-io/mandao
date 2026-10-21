# Review of T3 in MDO-0009, attempt 1

One blocking finding: a copy of the D3 folder map. Scenarios, D4 levels, graphify skip, no shell, TDD and tests check out. The fix touches src/skills/install.ts, outside T3's file list.

## Spec conformance
S-6.1 holds: pinned skill with no SKILL.md gives warn, message `brainstorming is missing: constitution, story, specify lose it (<fallback>); not found for <harnesses>`, fix `mandao skills add brainstorming` (FR-6 items covered). S-6.2 holds: nothing pinned gives info; no warn/error path for an unpinned skill. S-6.2/C1 holds: engine.test.ts syncProject then runDoctor on a fresh workspace, no warn or error; MANDAO_HOME points at a temp tree. D4 levels: pinned.includes(id) ? 'warn' : 'info'. graphify: REPORTED_AS_TOOLS skips it, still reported via OPTIONAL_TOOLS (doctor.ts:36-39). No shell: skillFindings only existsSync; catalogFindings passes probe only to toolVersionFindings. TDD: required, red true, evidence red, redTests.changed empty. AGENTS.md: no src/skills code changed, engine has no guide. Exemplar doctor-codex.ts shape followed.

## Findings

[core/medium] Blocking. ALSO_READS in src/engine/doctor-skills.ts copies the "OpenCode and Copilot also read .claude/skills and .agents/skills" fact that lives in src/skills/install.ts:89-91 (READS_SHARED, SHARED_FOLDERS). D3: "The map lives next to SKILL_DIRS in src/skills/install.ts"; D4: detection uses "the folders of D3"; duplicated business logic is a blocking clean-code item. Install and doctor must agree (P4). Fix: export one pure function from install.ts, e.g. readableSkillFolders(harness) built from HARNESS_FOLDER, READS_SHARED and SHARED_FOLDERS, and use it in `found`. Adds install.ts to the task's files.

[core/low] Advisory. REPORTED_AS_TOOLS = ['graphify'] copies OPTIONAL_TOOLS names (doctor.ts:36); circular-import reason weak. Fix: `skip` field on SkillFindingsInput, passed OPTIONAL_TOOLS.map(t => t.name) from catalogFindings.

[core/low] Advisory. D4 calls for an injectable runner; skillFindings has none (filesystem only). Not listed as a deviation. Record it or amend D4.

[core/low] Advisory. No test asserts runDoctor emits exactly one graphify finding. Fix: in the S-6.2/C1 integration test, assert exactly one finding mentions graphify.

[core/low] Advisory. S-6.1 warn path tested only at unit level; no check of the lock wiring in runDoctor. Optional integration case pinning brainstorming.

[core/low] Advisory, ASSUMPTION. Home folders checked as in the project (~/.agents/skills, ~/.github/skills); E4 documents only project folders. OpenCode's .opencode/skills not checked. Note under P4.

[core/low] Advisory, OPEN. architecture.md: layer diagram (line 26) allows engine -> skills, table (line 32) omits skills from Engine dependencies. Constitution needs one corrected; not this task's fault.

[core/low] Advisory. docs/cli.md changed but not in T3 files; accurate.

Gate evidence: every gate passed; secrets and sast NOT_INSTALLED; audit SKIPPED.

VERDICT: FAIL

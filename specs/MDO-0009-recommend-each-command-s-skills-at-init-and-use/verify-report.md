---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
verdict: verified
date: 2026-10-21
---

# Verify — Recommend each command's skills at init and use them in story and specify

Verified: every acceptance criterion and clause has a passing test at the level the spec asks for. The
unit suite (523 tests) and the e2e flows (45 tests) pass on a rebuilt CLI, and the smoke of the built
binary confirms `init --yes`. No product bug, nothing deferred to CI, no blocker.

## Acceptance criteria → tests

| AC / clause | Critical | Tests | Level | Result |
|---|---|---|---|---|
| AC-1 | yes | S-1.1 (command-skills); S-2.2 "selecting product-manager-toolkit only copies it into both folders and pins it with its commit" (init-skills) | unit, e2e | pass |
| AC-1/C1 | yes | S-2.1 and AC-1/C1, S-2.1/C1 (init-skills) | e2e | pass |
| AC-1/C2 | yes | S-2.3/C1 "no skill starts selected…", "nothing was run and no folder written…" (init-skills) | e2e | pass |
| AC-1/C3 | yes | S-3.1, S-3.1/C1 (skills, git-copy); S-3.3 ×2 (skills) | unit | pass |
| AC-1/C4 | yes | S-3.4 and S-3.4/C1, S-3.5, S-3.5/C1 (skills); AC-1/C4 ×2 at init (init-skills) | unit, e2e | pass |
| AC-2 | yes | S-4.1 `init --yes` as a process (init-skills); smoke of the built binary | e2e | pass |
| AC-2/C1 | yes | S-4.1/C1 and AC-2/C1 (init-skills); smoke: lock `skills: []` | e2e | pass |
| AC-3 | no | S-1.2 (command-skills); S-3.1 folder map ×2 (skills); "with only Codex chosen…" (init-skills) | unit, e2e | pass |
| AC-3/C1 | no | S-3.2 (skills); S-3.3/C1 and AC-3/C1 (init-skills); a copy that fails does not throw (git-copy) | unit, e2e | pass |
| AC-4 | no | S-5.1, once per harness: claude, codex, opencode, copilot, antigravity (content) | unit | pass |
| AC-4/C1 | no | S-5.1/C1, once per harness (content) | unit | pass |
| AC-5 | yes | S-6.1 ×3, S-6.2 ×2 (doctor-skills) | unit | pass |
| AC-5/C1 | yes | S-6.2/C1 "a fresh workspace reports the skills it lacks as info, never as warn or error" (engine) | e2e | pass |

Criticality comes from `verify-plan`. AC-1 and AC-2 are critical because `init` is a critical flow.
AC-5 is critical because of the doctor "clean after sync" flow.

### AC-5/C1

The smoke check on this machine could not show the `info` line: `~/.claude/skills` already holds three
of the skills, and doctor correctly counts a skill in the home folder as found (S-6.1, third test).
Running doctor against an empty `HOME` was refused by the sandbox guard, and it was not worked around. The
clause rests on the `engine.test.ts` test, which uses a temporary `MANDAO_HOME`.

## Suites

| Project | Kind | Result |
|---|---|---|
| mandao | unit (impacted by the spec's commits) | pass: 62 files, 523 tests |
| mandao | e2e (flows of AC-1, AC-2, AC-3, AC-5) | pass: 4 files, 45 tests |
| mandao | build + smoke of `dist/cli.js` | pass: rebuilt, `init --yes` as expected |

## TDD evidence (ADR 0022)

- `missingRed`: none. T1, T2 and T3 each have a RED row before their implementation, and another
  before each rework.
- Red tests changed after RED, all reviewed and none judged weakened:
  - T1 attempt 2: the `render()` filter in `content.test.ts` was narrowed to the command's `.md`
    (it also matched codex's `agents/openai.yaml`); biome autofixes.
  - T2 attempt 1: a scan-marker comment; `version: '7.0.0'` on the fixture to match the assertion;
    the S-4.1 tests read the real catalog via `vi.importActual`.
  - T3: none.
- Two tests were dropped at T2's RED to fit the 350-line limit. The Reviewer found that no scenario
  lost coverage.

## Security mentions (not blocking)

`verify-plan` lists none (`securityMentions: []`). The tagged advisories from the reviews, for a person to read:

- T2: `[security/medium]` git had no timeout and ssh could prompt. This was fixed in attempt 2: a 120 s timeout and `BatchMode=yes`.
- T2: `[security/low]` `http:` and `file:` remain in the URL allow-list. The pinned commit limits the risk.
- T2: `[security/low]` `GIT_SSH_COMMAND` replaces a person's own ssh command for these fetches.
- T2: `[security/low]` the secrets (gitleaks) and SAST (semgrep) gates are NOT_INSTALLED, so they never
  ran on this security-lens task. The review of the fetch and copy was a manual reading.

## Product bugs

None.

## Deferred to CI

None.

## Blockers

None.

## Consistency Check

Run over story, spec (requirements and design) and this report, against what was built.

| ID | Type | Finding | Severity | Owner |
|---|---|---|---|---|
| CC-5 | CONTRADICTION | [D4](spec.md#d4) says doctor detects skills "and an injectable runner"; `src/engine/doctor-skills.ts` only checks the filesystem (`existsSync`) and takes no runner. Behavior meets S-6.1/S-6.2 and "doctor runs no shell". | normal | dev |
| CC-6 | RULE | `docs/constitution/architecture.md`: the layer diagram (line 26) draws an arrow to `skills`, but the table (line 32) leaves `skills` out of what Engine may depend on. `doctor-skills.ts` imports `commandSkills` and `readableSkillFolders` from `src/skills/`, as D4 designs. | normal | dev |
| CC-7 | PREMISE | [P4](spec.md#p4) covers project skills folders. Doctor also counts the same folders under the home directory (for example `~/.agents/skills`, `~/.github/skills`), which E4 does not document. OpenCode's own `.opencode/skills` is not checked. | normal | dev |

No critical findings. Each one goes to `/mandao-clarify` or to the close's constitution and Kaizen
steps. None of them changes a verified clause.

## Evidence

Build, `{"status":"PASS","exitCode":0}`, `dist/cli.js` 435.18 KB:

```
node .mandao/bin/mandao.mjs run build mandao
```

Unit suite: `Test Files 62 passed (62)`, `Tests 523 passed (523)`, `{"status":"PASS", … "workers":5}`. The command passed
`suites[0].files` as separate arguments; a first attempt with one quoted string matched nothing and was
discarded.

```
node .mandao/bin/mandao.mjs run tests mandao <suites[0].files>
```

E2E flows (`tests.e2e` is not configured): `Test Files 4 passed (4)`, `Tests 45 passed (45)`:

```
npx vitest run test/integration/init-skills.test.ts test/integration/engine.test.ts test/integration/cli.test.ts test/integration/doctor-cli.test.ts
```

Smoke of the built binary, in a fresh temporary workspace, with no network: `node dist/cli.js init --yes` exited 0 and wrote 74 files. The lock has `skills: []` and no skill folder was created.

```
Skills the commands use (none installed; init --yes never installs one):
  graphify@0.9.92 https://github.com/Graphify-Labs/graphify
  software-architect@2.34.1 https://github.com/JuankCadavid/akili-specs#v2.34.1:.claude/skills/software-architect
  product-manager-toolkit@2.12.0 https://github.com/alirezarezvani/claude-skills#v2.12.0:product-team/skills/product-manager-toolkit
  brainstorming@7.0.0 https://github.com/obra/superpowers#v7.0.0:skills/brainstorming
Install them later with: mandao skills add graphify software-architect product-manager-toolkit brainstorming
```

Gate logs per task are in `_log/gates/` (`T1-2.md`, `T2-2.md`, `T3-2.md`), and the reviews are in `_log/reviews/`.

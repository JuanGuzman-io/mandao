---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
status: approved
---

# Tasks — Prove that a crashing doctor never sends garbage to CI

What work, in what order: a single test-only task adds the process-level doctor test and points the
old in-process test to it. Nothing under `src/`, `core/`, `docs/` or CI changes.

| Task | Title | Kind | Tier | Depends on | AC | Status |
|---|---|---|---|---|---|---|
| T1 | Process-level doctor test | test | standard | — | AC-1, AC-2 | done |

**Waves:** Wave 1: T1.

## Notes

- **Where the files come from:** the code graph (`graphify-out/graph.json`) held only the spec
  documents of the worktree, so files and modules come from
  [design, Changes by project and module](design.md#changes-by-project-and-module).
- **No module guide is due:** `test/` has no `AGENTS.md` ([design, Module Docs Impact](design.md#module-docs-impact)).
- **Constitution impact:** the exemplar row is applied at `/mandao-close`
  ([design, Constitution Impact](design.md#constitution-impact)).
- **ASSUMPTION (test-policy.md, TDD):** the new tests characterize behavior that already exists
  ([P1](design.md#p1--an-invalid-lock-reaches-the-cli-catch),
  [P3](design.md#p3--an-invalid-modelsyml-is-a-finding-not-a-crash)), so they pass on their first run
  and cannot give red evidence against unchanged code. Instead the Implementer shows that each
  assertion can fail with a local, uncommitted mutation and records it in
  [the execution log](_log/execution.md#mutation-evidence-t1). The Leader decides at
  `/mandao-implement`; the decision (mutation evidence in place of red) is recorded in that log.

## Task details

### [x] T1 — Process-level doctor test in `test/integration/doctor-process.test.ts`

```yaml
project: mandao
kind: test
tier: standard
files: [test/integration/doctor-process.test.ts, test/integration/doctor-cli.test.ts]
exemplar: test/unit/launcher.test.ts
risk_tags: []
ac: [AC-1, AC-1/C1, AC-1/C2, AC-2, AC-2/C1]
scenarios: [S-1.1, S-1.1/C1, S-1.1/C2, S-1.2, S-1.2/C1, S-2.1, S-2.1/C1, S-2.2, S-2.2/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: [], e2e: ["S-1.1: a lock with broken YAML gives status 1, stdout exactly '' and stderr matching /\\berror\\b/ and containing join('.mandao', 'mandao.lock')", "S-1.2: a lock that is valid YAML but fails the lock schema gives the same outcome as S-1.1", "S-1.1/C2: the file matches test/**/*.test.ts, so npm test and the CI check job run it", "S-2.1: a models.yml with broken YAML gives status 1, stderr exactly '', JSON.parse of the whole stdout with schema_version 1 and an error finding whose message contains join('.mandao', 'models.yml')", "S-2.2: a models.yml that is valid YAML but fails the models schema gives the same outcome as S-2.1", "NFR-1: npx vitest run on the file, build included, reports under 5 s"] }
dod: ["beforeAll builds src/cli/index.ts with tsup build() and config false, using the same entry, format, target and platform as tsup.config.ts, into mkdtemp under node_modules/.cache/ created with recursive mkdirSync (D1)", "spawnSync of process.execPath on <out>/cli.js with encoding utf8, a 20 s timeout and MANDAO_HOME set to a fresh makeTree (D4, P7)", "workspaces from makeTree with the minimal valid config of doctor-cli.test.ts S-4.2 plus one broken file per case; lock cases and models cases each in one test.each (D4)", "assertions exactly as D3: no snapshot, no parser wording, no 'invalid configuration:' header", "afterAll removes the build directory only (D5)", "no vi.mock and no console or stdout spies (D2)", "each assertion shown to fail once by a local uncommitted mutation, recorded in execution.md (see ASSUMPTION above)", "the comment above the S-2.2 test in doctor-cli.test.ts points to doctor-process.test.ts as the proof of the stderr output and exit code 1 set by src/cli/index.ts; no assertion changes there (D6)", "no change under src/, core/, docs/ or .github/", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/integration/doctor-process.test.ts test/integration/doctor-cli.test.ts
depends_on: []
parallel_safe: false
```

#### What
Add `test/integration/doctor-process.test.ts`. It builds the real CLI once, then runs
`doctor --json` as a separate process in four throwaway workspaces:

- a lock with broken YAML (S-1.1) and a lock that fails the lock schema (S-1.2): exit 1, nothing on
  stdout, an error naming `.mandao/mandao.lock` on stderr;
- a `models.yml` with broken YAML (S-2.1) and one that fails the models schema (S-2.2): exit 1, nothing
  on stderr, one JSON report with an `error` finding naming `.mandao/models.yml`.

Also update one comment in `test/integration/doctor-cli.test.ts` so it points to the new test.

#### Done when
- The CLI is built in `beforeAll` with tsup into a fresh directory under `node_modules/.cache/` (D1).
- Each case runs in its own workspace with an isolated `MANDAO_HOME` (D4).
- The checks follow D3: no snapshots, no parser wording.
- `afterAll` removes only the build directory (D5).
- No mocks and no spies (D2).
- Every assertion was shown to fail once with a local mutation (see the ASSUMPTION in Notes).
- The S-2.2 comment in `doctor-cli.test.ts` points to the new test (D6).
- Nothing changes under `src/`, `core/`, `docs/` or `.github/`; lint and typecheck are green.
- The new file runs in under 5 s, build included (NFR-1).

#### How to verify
```sh
npx vitest run test/integration/doctor-process.test.ts test/integration/doctor-cli.test.ts
```
